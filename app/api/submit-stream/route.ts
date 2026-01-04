import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  submitBatchToJudge0,
  getBatchResults,
  SubmissionData,
} from "@/lib/judge0";
import { Language } from "@prisma/client";
import { updateUserLeaderboard } from "@/lib/leaderboard";
import { checkAndAwardAchievements } from "@/lib/achievements";

export const dynamic = "force-dynamic";

const languageMap: Record<string, number> = {
  PYTHON: 71,
  CPP: 54,
  JAVASCRIPT: 63,
  JAVA: 62,
};

// Background processor - runs async without blocking
async function processSubmissionAsync(
  submissionId: string,
  problemId: string,
  code: string,
  languageId: number,
  userId: string,
  submissionCreatedAt: Date,
  isAdmin: boolean,
  timeLimit?: number,
  memoryLimit?: number,
) {
  try {
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          orderBy: { orderIndex: "asc" },
          select: {
            id: true,
            input: true,
            output: true,
            expectedOutputs: true,
            isHidden: true,
            orderIndex: true,
          },
        },
      },
    });

    if (!problem) {
      // Problem doesn't exist - mark submission as failed and increment count
      await prisma.$transaction(async tx => {
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            verdict: "REJECTED",
            runtime: 0,
            memory: 0,
            testCasesPassed: 0,
          },
        });
      });
      return;
    }

    // Check if problem is published (admins can submit to unpublished problems)
    if (!problem.publishedAt && !isAdmin) {
      // Problem is not published and user is not admin - reject submission
      await prisma.$transaction(async tx => {
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            verdict: "REJECTED",
            runtime: 0,
            memory: 0,
            testCasesPassed: 0,
          },
        });
      });
      return;
    }

    const testResults = [];
    let allPassed = true;
    let maxRuntime = 0;
    let maxMemory = 0;

    // Prepare batch submission - all test cases at once
    const batchSubmissions: SubmissionData[] = problem.testCases.map(
      testCase => {
        const submissionParams: SubmissionData = {
          source_code: code,
          language_id: languageId,
          stdin: testCase.input,
        };

        // Add time and memory limits (Judge0 expects: cpu_time_limit in seconds, memory_limit in KB)
        if (timeLimit !== undefined) {
          const timeLimitInSeconds = timeLimit / 1000; // Convert ms to seconds
          submissionParams.cpu_time_limit = Math.max(0.1, timeLimitInSeconds); // Minimum 0.1s
        }
        if (memoryLimit !== undefined) {
          submissionParams.memory_limit = Math.max(128, memoryLimit); // Minimum 128KB
        }

        // Only send expected_output for single-answer test cases
        if (
          !testCase.expectedOutputs ||
          testCase.expectedOutputs.length === 0
        ) {
          submissionParams.expected_output = testCase.output.trim();
        }

        return submissionParams;
      },
    );

    // Track processed test cases across try/catch
    const processedResults = new Set<number>();

    try {
      // Submit all test cases as a batch
      const batchTokens = await submitBatchToJudge0(batchSubmissions);

      // Validate batch submission succeeded
      if (!batchTokens || batchTokens.length === 0) {
        throw new Error("Failed to submit batch to Judge0");
      }

      if (batchTokens.length !== problem.testCases.length) {
        throw new Error(
          `Judge0 returned ${batchTokens.length} tokens for ${problem.testCases.length} test cases`,
        );
      }

      // Poll and save results incrementally for UI feedback
      const maxAttempts = 30;
      const interval = 1000;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Get current batch results (wrap in try-catch to handle network errors)
        let results: Awaited<ReturnType<typeof getBatchResults>>;
        try {
          results = await getBatchResults(batchTokens);
        } catch (error) {
          console.error(
            `Failed to fetch batch results on attempt ${attempt + 1}:`,
            error,
          );
          // If this is the last attempt, mark submission as rejected
          if (attempt === maxAttempts - 1) {
            throw new Error(
              "Failed to fetch results from Judge0 after multiple attempts",
            );
          }
          // Otherwise, wait and retry
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }

        // Process newly completed tests
        for (let i = 0; i < results.length; i++) {
          const result = results[i];

          // Guard against index out of bounds
          if (i >= problem.testCases.length) {
            console.error(
              `Judge0 returned more results than expected: ${i} >= ${problem.testCases.length}`,
            );
            continue;
          }

          const testCase = problem.testCases[i];

          // Skip if already processed or still in queue/processing
          if (processedResults.has(i) || result.status.id <= 2) continue;

          processedResults.add(i);

          // Check if output matches any of the expected outputs
          const userOutput = result.stdout?.trim() || "";

          // Build list of valid outputs - always include primary output
          const validOutputs =
            testCase.expectedOutputs && testCase.expectedOutputs.length > 0
              ? [testCase.output, ...testCase.expectedOutputs] // Include primary + alternatives
              : [testCase.output]; // Just primary

          // For multi-answer cases: we don't send expected_output to Judge0,
          // so it returns status 3 (Accepted). We then validate manually.
          // For single-answer cases: Judge0 validates (status 3 or 4)
          const isMultiAnswer =
            testCase.expectedOutputs && testCase.expectedOutputs.length > 0;

          // Code executed successfully if status is 3 (Accepted) or 4 (Wrong Answer)
          // Other statuses (5=TLE, 6=CE, 7-12=RE, etc.) mean execution failed
          const isSuccessfulExecution =
            result.status.id === 3 || result.status.id === 4;

          const passed =
            isSuccessfulExecution &&
            validOutputs.some(
              (expected: string) => userOutput === expected.trim(),
            );

          // Safely parse runtime and memory with fallbacks
          const runtime = Math.max(0, parseFloat(result.time || "0") * 1000);
          const memory = Math.max(0, result.memory || 0);

          if (!passed) allPassed = false;
          // Always track max runtime/memory even for failed tests (compilation/runtime errors still take time)
          if (runtime > 0) maxRuntime = Math.max(maxRuntime, runtime);
          if (memory > 0) maxMemory = Math.max(maxMemory, memory);

          // Determine error message and status based on Judge0 status codes
          let errorMessage = null;
          let statusId = result.status.id;

          // For multi-answer cases: override statusId to Wrong Answer if validation failed
          if (isMultiAnswer && !passed && result.status.id === 3) {
            statusId = 4; // Wrong Answer
          }

          // Judge0 Status Codes:
          // 3 = Accepted, 4 = Wrong Answer
          // 5 = Time Limit Exceeded, 6 = Compilation Error
          // 7-12, 20 = Runtime Errors (SIGSEGV, SIGFPE, SIGABRT, etc.)
          // 13 = Internal Error, 17 = Memory Limit Exceeded

          // Check for compilation errors first
          if (result.compile_output || statusId === 6) {
            errorMessage = result.compile_output || "Compilation Error";
            statusId = 6; // Ensure it's marked as Compilation Error
          }
          // Check for syntax errors in stderr (Python)
          else if (result.stderr && result.stderr.includes("SyntaxError")) {
            errorMessage = result.stderr;
            statusId = 6; // Treat Python SyntaxError as Compilation Error
          }
          // Check for other stderr output (runtime errors)
          else if (result.stderr) {
            errorMessage = result.stderr;
            // Keep original statusId for runtime errors
          }
          // Check for specific error codes
          else if (statusId === 5) {
            errorMessage = "Time Limit Exceeded";
          } else if (statusId === 13) {
            errorMessage = "Internal Error (Judge0)";
          } else if (statusId === 17) {
            errorMessage = "Memory Limit Exceeded";
          }

          // Save test result immediately for UI feedback
          try {
            await prisma.testResult.create({
              data: {
                submissionId,
                testCaseId: testCase.id,
                passed,
                output: userOutput,
                expectedOutput: testCase.output.trim(),
                runtime: Math.round(runtime),
                memory,
                errorMessage,
                statusId,
              },
            });

            testResults.push({
              passed,
              runtime: Math.round(runtime),
              memory,
              errorMessage,
              statusId, // Track status for verdict determination
            });
          } catch (dbError) {
            console.error("Failed to save test result:", dbError);
            // Don't crash the whole submission, continue with other tests
            // But mark this test as failed in local array
            testResults.push({
              passed: false,
              runtime: Math.round(runtime),
              memory,
              errorMessage: "Failed to save test result",
              statusId: 13, // Internal Error
            });
            allPassed = false;
          }
        }

        // Check if all tests are done
        if (processedResults.size === problem.testCases.length) {
          break;
        }

        // Wait before next poll
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, interval));
        }
      }

      // Mark any unprocessed tests as timed out (don't throw error)
      if (processedResults.size < problem.testCases.length) {
        allPassed = false; // Fix: Mark submission as failed if any test timed out
        for (let i = 0; i < problem.testCases.length; i++) {
          if (!processedResults.has(i)) {
            const testCase = problem.testCases[i];
            try {
              await prisma.testResult.create({
                data: {
                  submissionId,
                  testCaseId: testCase.id,
                  passed: false,
                  output: "",
                  expectedOutput: testCase.output.trim(),
                  runtime: 0,
                  memory: 0,
                  errorMessage: "Execution timed out",
                  statusId: 5, // Time Limit Exceeded
                },
              });
            } catch (dbError) {
              console.error(
                `Failed to create timeout test result for test case ${i}:`,
                dbError,
              );
            }
            testResults.push({
              passed: false,
              runtime: 0,
              memory: 0,
              errorMessage: "Execution timed out",
              statusId: 5,
            });
            // allPassed already set to false on line 284
          }
        }
      }
    } catch (error: unknown) {
      console.error("Batch submission error:", error);
      allPassed = false;
      // Mark all unprocessed tests as failed (only those not yet processed)
      for (let i = 0; i < problem.testCases.length; i++) {
        // Skip already processed tests
        if (processedResults.has(i)) continue;

        const testCase = problem.testCases[i];
        try {
          await prisma.testResult.create({
            data: {
              submissionId,
              testCaseId: testCase.id,
              passed: false,
              output: "",
              expectedOutput: testCase.output.trim(),
              runtime: 0,
              memory: 0,
              errorMessage:
                error instanceof Error
                  ? error.message
                  : "Batch execution failed",
              statusId: 13, // Internal Error
            },
          });
        } catch (dbError) {
          console.error(
            `Failed to create error test result for test case ${i}:`,
            dbError,
          );
        }
        testResults.push({
          passed: false,
          runtime: 0,
          memory: 0,
          errorMessage:
            error instanceof Error ? error.message : "Batch execution failed",
          statusId: 13, // Internal Error
        });
      }
    }

    // Determine verdict - simple: ACCEPTED or REJECTED
    // Detailed error info is in TestResults (errorMessage, statusId)
    const verdict = allPassed ? "ACCEPTED" : "REJECTED";

    // Count from actual database records, not local array
    const dbTestResults = await prisma.testResult.findMany({
      where: { submissionId },
      select: { passed: true },
    });
    const testCasesPassed = dbTestResults.filter(r => r.passed).length;

    // Handle XP, achievements, and problem stats if accepted - BEFORE updating verdict
    // This ensures achievements are in DB before polling sees ACCEPTED
    if (verdict === "ACCEPTED") {
      const difficultyXP = { EASY: 10, MEDIUM: 20, HARD: 30 };
      let xpEarned =
        difficultyXP[problem.difficulty as keyof typeof difficultyXP] || 10;

      // Check if this is today's daily challenge for bonus XP
      let dailyChallengeBonus = 0;
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const dailyChallenge = await prisma.dailyChallenge.findUnique({
        where: { date: today },
        select: { problemId: true, xpBonus: true },
      });

      if (dailyChallenge && dailyChallenge.problemId === problemId) {
        dailyChallengeBonus = dailyChallenge.xpBonus;
        xpEarned += dailyChallengeBonus;
      }

      // Use transaction with Serializable isolation to prevent XP double-award race condition
      await prisma.$transaction(
        async tx => {
          // Update user stats (inside transaction to prevent race conditions)

          // Check existing stat BEFORE upsert to detect first solve
          // Serializable isolation prevents phantom reads
          const existingStat = await tx.problemStat.findUnique({
            where: { userId_problemId: { userId, problemId } },
          });

          const wasAlreadySolved = existingStat?.solved === true;

          // Update problem stat with upsert (include xpEarned for leaderboard period calculations)
          await tx.problemStat.upsert({
            where: { userId_problemId: { userId, problemId } },
            create: {
              userId,
              problemId,
              attempts: 1,
              solved: true,
              status: "SOLVED",
              solvedAt: submissionCreatedAt, // Use submission's createdAt for accuracy
              xpEarned: xpEarned, // Track XP including daily bonus for weekly/monthly leaderboard
            },
            update: {
              attempts: { increment: 1 },
              solved: true,
              status: "SOLVED",
              solvedAt: existingStat?.solvedAt ?? submissionCreatedAt, // Set only if not already set
              // Don't update xpEarned on re-solve - only first solve counts
            },
          });

          // Award XP only if wasn't already solved
          if (!wasAlreadySolved) {
            // Get current XP and calculate new level in one query
            const currentUser = await tx.user.findUnique({
              where: { id: userId },
              select: { xp: true },
            });

            if (currentUser) {
              const newXP = currentUser.xp + xpEarned;
              const newLevel = Math.floor(Math.sqrt(newXP / 5)) + 1;

              // Single update with both XP and level
              await tx.user.update({
                where: { id: userId },
                data: {
                  xp: newXP,
                  level: newLevel,
                },
              });

              // Update leaderboard (async, don't await to avoid blocking submission)
              updateUserLeaderboard(userId, newXP).catch(error =>
                console.error("Leaderboard update failed:", error),
              );
            }
          }
        },
        {
          isolationLevel: "Serializable", // Prevent XP double-award from concurrent submissions
        },
      );

      // Check and award achievements (await to ensure they're saved before verdict update)
      // Get attempt count for first_attempt achievement
      const attemptCount = await prisma.problemStat.findUnique({
        where: { userId_problemId: { userId, problemId } },
        select: { attempts: true },
      });

      const unlockedAchievements = await checkAndAwardAchievements({
        userId,
        problemId,
        submissionTime: submissionCreatedAt,
        isFirstAttempt: attemptCount?.attempts === 1,
      }).catch(error => {
        console.error("Achievement check failed:", error);
        return [];
      });

      // NOW update submission with final verdict - AFTER achievements are saved to DB
      // This ensures polling can find achievements when it detects ACCEPTED
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          verdict,
          runtime: Math.round(maxRuntime),
          memory: maxMemory,
          testCasesPassed,
        },
      });
    } else {
      // Failed submission - update verdict and stats
      await prisma.submission.update({
        where: { id: submissionId },
        data: {
          verdict,
          runtime: Math.round(maxRuntime),
          memory: maxMemory,
          testCasesPassed,
        },
      });

      // Update problem stat - only update if not already solved
      await prisma.problemStat.upsert({
        where: { userId_problemId: { userId, problemId } },
        create: {
          userId,
          problemId,
          attempts: 1,
          solved: false,
          status: "ATTEMPTED",
        },
        update: {
          attempts: { increment: 1 },
          // Don't downgrade status if already solved
        },
      });
    }
  } catch (error) {
    console.error("Background processing error:", error);
    // Properly update submission with failed state and complete data
    try {
      // Use transaction to update both submission and user stats atomically
      await prisma.$transaction(async tx => {
        await tx.submission.update({
          where: { id: submissionId },
          data: {
            verdict: "REJECTED",
            runtime: 0,
            memory: 0,
            testCasesPassed: 0,
          },
        });
      });
    } catch (updateError) {
      console.error("Failed to update submission after error:", updateError);
    }
  }
}

export async function POST(request: NextRequest) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    return NextResponse.json(
      { error: "Please sign in to submit solutions" },
      { status: 401 },
    );
  }

  // Check if user's email is verified
  if (!user.emailVerified) {
    return NextResponse.json(
      {
        error: "Please verify your email before submitting solutions",
        requiresVerification: true,
      },
      { status: 403 },
    );
  }

  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { problemSlug, code, language, timeLimit, memoryLimit } = body;

    // Validate input
    if (!problemSlug || typeof problemSlug !== "string") {
      return NextResponse.json(
        { error: "Invalid problem slug" },
        { status: 400 },
      );
    }

    if (!code || typeof code !== "string" || code.trim().length === 0) {
      return NextResponse.json(
        { error: "Code cannot be empty" },
        { status: 400 },
      );
    }

    if (code.length > 65536) {
      // 64KB max
      return NextResponse.json(
        { error: "Code too large (max 64KB)" },
        { status: 400 },
      );
    }

    if (!language || typeof language !== "string") {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    // Validate time/memory limits if provided
    if (
      timeLimit !== undefined &&
      (typeof timeLimit !== "number" || timeLimit < 0 || timeLimit > 60000)
    ) {
      return NextResponse.json(
        { error: "Invalid time limit (0-60000ms)" },
        { status: 400 },
      );
    }

    if (
      memoryLimit !== undefined &&
      (typeof memoryLimit !== "number" ||
        memoryLimit < 0 ||
        memoryLimit > 512000)
    ) {
      return NextResponse.json(
        { error: "Invalid memory limit (0-512000KB)" },
        { status: 400 },
      );
    }

    const problem = await prisma.problem.findUnique({
      where: { slug: problemSlug },
      include: { testCases: { orderBy: { orderIndex: "asc" } } },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Check if problem has test cases
    if (!problem.testCases || problem.testCases.length === 0) {
      return NextResponse.json(
        { error: "Problem has no test cases" },
        { status: 400 },
      );
    }

    // Check premium access
    if (problem.isPremium && !user.isPro) {
      return NextResponse.json(
        {
          error:
            "This is a premium problem. Upgrade to Pro to submit solutions.",
        },
        { status: 403 },
      );
    }

    // Validate language is in the allowed list and get language ID
    const validLanguages = ["PYTHON", "CPP", "JAVASCRIPT", "JAVA"];
    if (!validLanguages.includes(language)) {
      return NextResponse.json(
        {
          error:
            "Unsupported language. Supported: Python, C++, JavaScript, Java",
        },
        { status: 400 },
      );
    }

    const languageId = languageMap[language];
    if (!languageId) {
      // This should never happen if validLanguages and languageMap are in sync
      console.error(
        `Language ${language} in validLanguages but missing from languageMap`,
      );
      return NextResponse.json(
        { error: "Language configuration error" },
        { status: 500 },
      );
    }

    // Create submission record with PENDING status
    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        code,
        language: language as Language,
        verdict: "PENDING",
        testCasesPassed: 0,
        totalTestCases: problem.testCases.length,
      },
    });

    // Start background processing using after() to ensure it completes on Vercel
    // after() tells Vercel to keep the function alive until the promise resolves
    after(
      processSubmissionAsync(
        submission.id,
        problem.id,
        code,
        languageId,
        user.id,
        submission.createdAt,
        user.role === "ADMIN",
        timeLimit,
        memoryLimit,
      ).catch(async error => {
        console.error("Fatal error in background processing:", error);
        // Ensure submission is marked as failed (this is a backup catch)
        try {
          await prisma.submission.update({
            where: { id: submission.id },
            data: {
              verdict: "REJECTED",
              runtime: 0,
              memory: 0,
              testCasesPassed: 0,
            },
          });
        } catch (updateError) {
          console.error(
            "Failed to update submission after fatal error:",
            updateError,
          );
        }
      }),
    );

    // Return immediately with submission ID
    return NextResponse.json({
      success: true,
      submissionId: submission.id,
      totalTestCases: problem.testCases.length,
    });
  } catch (error: unknown) {
    console.error("Submission error:", error);
    return NextResponse.json(
      { error: (error as Error)?.message || "Submission failed" },
      { status: 500 },
    );
  }
}
