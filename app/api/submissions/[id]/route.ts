import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            image: true,
            xp: true,
            level: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            testCases: {
              select: {
                id: true,
              },
            },
          },
        },
        testResults: {
          include: {
            testCase: {
              select: {
                input: true,
                orderIndex: true,
              },
            },
          },
          orderBy: {
            testCase: {
              orderIndex: "asc",
            },
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Check if user can view this submission
    const currentUser = await getCurrentUser();

    const isOwner = currentUser && submission.userId === currentUser.id;
    const isAdmin = currentUser?.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      // For non-owners, show the actual passed count (same as owners see)
      const testCasesPassed = submission.testResults.filter(
        tr => tr.passed,
      ).length;

      // Hide code and detailed results for non-owners
      return NextResponse.json({
        success: true,
        verdict: submission.verdict,
        runtime: submission.runtime,
        memory: submission.memory,
        language: submission.language,
        createdAt: submission.createdAt,
        user: submission.user,
        problem: submission.problem,
        isComplete: submission.verdict !== "PENDING",
        testCasesPassed,
        totalTestCases: submission.problem.testCases.length,
      });
    }

    // Full details for owner/admin - polling-friendly format
    const isComplete = submission.verdict !== "PENDING";
    const completedTests = submission.testResults.length;
    const totalTestCases = submission.problem.testCases.length;

    // Calculate testCasesPassed dynamically from test results
    // This ensures accurate count even during async processing
    const testCasesPassed = submission.testResults.filter(
      tr => tr.passed,
    ).length;

    // Calculate XP earned for this submission
    let xpEarned = 0;
    if (submission.verdict === "ACCEPTED") {
      // Check if this was the first solve by looking at the problemStat
      const problemStat = await prisma.problemStat.findUnique({
        where: {
          userId_problemId: {
            userId: submission.userId,
            problemId: submission.problemId,
          },
        },
        select: {
          solvedAt: true,
          attempts: true,
        },
      });

      // Check if this submission was the first accepted submission
      // solvedAt is set to match the first solve's submission.createdAt
      // So if they match, this submission earned XP
      if (problemStat?.solvedAt) {
        const timeDiff = Math.abs(
          problemStat.solvedAt.getTime() - submission.createdAt.getTime(),
        );

        // Timestamps should match exactly, but allow 1s buffer for safety
        if (timeDiff < 1000) {
          const difficultyXP = { EASY: 10, MEDIUM: 20, HARD: 30 };
          xpEarned =
            difficultyXP[
              submission.problem.difficulty as keyof typeof difficultyXP
            ] || 10;
        }
      }
    }

    // Get achievements unlocked around the time of this submission (within 30 seconds)
    // This catches achievements awarded by the background processor
    const recentAchievements = isComplete
      ? await prisma.userAchievement.findMany({
          where: {
            userId: submission.userId,
            unlockedAt: {
              gte: new Date(submission.createdAt.getTime() - 5000), // 5s before
              lte: new Date(submission.createdAt.getTime() + 30000), // 30s after
            },
          },
          include: {
            achievement: {
              select: {
                id: true,
                name: true,
                icon: true,
                xpReward: true,
              },
            },
          },
        })
      : [];

    return NextResponse.json({
      success: true,
      id: submission.id,
      verdict: submission.verdict,
      runtime: submission.runtime,
      memory: submission.memory,
      language: submission.language,
      code: submission.code,
      createdAt: submission.createdAt,
      testCasesPassed, // Use calculated value, not submission.testCasesPassed
      isComplete,
      completedTests,
      totalTestCases,
      xp: submission.user.xp,
      level: submission.user.level,
      xpEarned, // Add XP earned for this submission
      user: {
        id: submission.user.id,
        username: submission.user.username,
        image: submission.user.image,
      },
      problem: {
        id: submission.problem.id,
        title: submission.problem.title,
        slug: submission.problem.slug,
        difficulty: submission.problem.difficulty,
      },
      testResults: submission.testResults.map(tr => ({
        testCaseId: tr.testCaseId,
        testCaseIndex: tr.testCase?.orderIndex ?? 0, // Use the actual test case order
        passed: tr.passed,
        runtime: tr.runtime,
        memory: tr.memory,
        input: tr.testCase?.input || "",
        output: tr.output,
        expectedOutput: tr.expectedOutput,
        errorMessage: tr.errorMessage,
        statusId: tr.statusId,
      })),
      unlockedAchievements: recentAchievements.map(ua => ({
        id: ua.achievement.id,
        name: ua.achievement.name,
        icon: ua.achievement.icon,
        xpReward: ua.achievement.xpReward,
      })),
    });
  } catch (error) {
    console.error("Submission fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 },
    );
  }
}
