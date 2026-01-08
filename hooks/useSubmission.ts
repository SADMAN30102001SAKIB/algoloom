"use client";

import { useState } from "react";
import { toast } from "sonner";

// Helper function to get human-readable status description
function getStatusDescription(statusId?: number): string {
  if (!statusId) return "Unknown";

  // Judge0 Status Codes
  switch (statusId) {
    case 3:
      return "Accepted";
    case 4:
      return "Wrong Answer";
    case 5:
      return "Time Limit Exceeded";
    case 6:
      return "Compilation Error";
    case 7:
    case 8:
    case 9:
    case 10:
    case 11:
    case 12:
    case 20:
      return "Runtime Error";
    case 13:
      return "Internal Error";
    case 17:
      return "Memory Limit Exceeded";
    default:
      return "Unknown";
  }
}

interface TestCaseResult {
  testCaseId: string;
  testCaseIndex: number;
  passed: boolean;
  input: string;
  output: string;
  expectedOutput: string;
  runtime: number;
  memory: number;
  statusId: number;
  statusDescription: string;
  stderr?: string;
  compileOutput?: string;
}

interface SubmissionSummary {
  verdict: string;
  runtime: number;
  memory: number;
  testCasesPassed: number;
  totalTestCases: number;
  xpEarned: number;
  newLevel: number;
  errorMessage?: string;
}

export function useSubmission(problemSlug: string) {
  const [testCaseResults, setTestCaseResults] = useState<TestCaseResult[]>([]);
  const [currentTestIndex, setCurrentTestIndex] = useState<number>(-1);
  const [summary, setSummary] = useState<SubmissionSummary | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submitCode = async (
    code: string,
    language: string,
    timeLimit?: number,
    memoryLimit?: number,
  ) => {
    setSubmitting(true);
    setTestCaseResults([]);
    setCurrentTestIndex(-1); // Don't show running animation for validation errors
    setSummary(null);

    try {
      // Submit code - returns immediately with submission ID
      const response = await fetch("/api/submit-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          code,
          language,
          timeLimit,
          memoryLimit,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        // Empty response or invalid JSON
        data = {
          error: "Server returned an invalid response. Please try again.",
        };
      }

      if (!response.ok || !data.submissionId) {
        // Handle validation errors as rejections, not runtime errors
        setSummary({
          verdict: "REJECTED",
          runtime: 0,
          memory: 0,
          testCasesPassed: 0,
          totalTestCases: 0,
          xpEarned: 0,
          newLevel: 1,
          errorMessage: data.error || "Validation error",
        });
        setSubmitting(false);
        setCurrentTestIndex(-1);
        return;
      }

      // Start polling for results
      setCurrentTestIndex(0); // Now start the animation
      const submissionId = data.submissionId;
      const pollInterval = 200;

      const poll = async () => {
        try {
          const pollResponse = await fetch(`/api/submissions/${submissionId}`);
          const pollData = await pollResponse.json();

          if (pollData.error) {
            throw new Error(pollData.error);
          }

          // Update test results - always use the complete array sorted by testCaseIndex
          // This ensures we don't miss any results due to polling timing issues
          if (pollData.testResults && pollData.testResults.length > 0) {
            const sortedResults = pollData.testResults
              .map((result: TestCaseResult & { errorMessage?: string }) => ({
                ...result,
                stderr: result.errorMessage,
                compileOutput: result.errorMessage,
                statusDescription: getStatusDescription(result.statusId),
              }))
              .sort(
                (a: TestCaseResult, b: TestCaseResult) =>
                  a.testCaseIndex - b.testCaseIndex,
              );

            setTestCaseResults(sortedResults);
            setCurrentTestIndex(pollData.testResults.length);
          } else if (
            !pollData.isComplete &&
            (!pollData.testResults || pollData.testResults.length === 0)
          ) {
            setCurrentTestIndex(0);
          }

          // Check if complete
          if (pollData.isComplete && pollData.verdict !== "PENDING") {
            setSummary({
              verdict: pollData.verdict,
              runtime: pollData.runtime || 0,
              memory: pollData.memory || 0,
              testCasesPassed: pollData.testCasesPassed || 0,
              totalTestCases: pollData.totalTestCases || 0,
              xpEarned: pollData.xpEarned || 0, // Use actual XP earned from backend
              newLevel: pollData.level || 1,
            });

            // Show achievement toasts with staggered delay
            if (pollData.unlockedAchievements?.length > 0) {
              pollData.unlockedAchievements.forEach(
                (
                  achievement: {
                    name: string;
                    icon: string;
                    xpReward: number;
                  },
                  index: number,
                ) => {
                  setTimeout(() => {
                    toast.success(
                      `${achievement.icon} Achievement Unlocked: ${achievement.name}!`,
                      {
                        description: `+${achievement.xpReward} XP`,
                        duration: 5000,
                      },
                    );
                  }, index * 2000); // 2000ms delay between each toast
                },
              );
            }

            setCurrentTestIndex(-1);
            setSubmitting(false);
            return;
          }

          // Continue polling
          setTimeout(poll, pollInterval);
        } catch (pollError) {
          console.error("Polling error:", pollError);
          setSummary({
            verdict: "REJECTED",
            runtime: 0,
            memory: 0,
            testCasesPassed: 0,
            totalTestCases: data.totalTestCases || 0,
            xpEarned: 0,
            newLevel: 1,
            errorMessage:
              pollError instanceof Error
                ? pollError.message
                : "Submission failed",
          });
          setSubmitting(false);
        }
      };

      poll();
    } catch (error) {
      console.error("Submission error:", error);
      setSummary({
        verdict: "REJECTED",
        runtime: 0,
        memory: 0,
        testCasesPassed: 0,
        totalTestCases: 0,
        xpEarned: 0,
        newLevel: 1,
        errorMessage:
          error instanceof Error ? error.message : "Submission failed",
      });
      setSubmitting(false);
    }
  };

  return {
    testCaseResults,
    currentTestIndex,
    summary,
    submitting,
    submitCode,
  };
}
