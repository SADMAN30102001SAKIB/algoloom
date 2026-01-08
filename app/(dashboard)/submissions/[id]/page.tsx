"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/ui/PageLoader";

interface TestResult {
  testCaseId: string;
  testCaseIndex: number;
  passed: boolean;
  runtime: number;
  memory: number;
  input: string;
  output: string;
  expectedOutput: string;
  errorMessage?: string;
  statusId?: number;
}

interface Submission {
  id: string;
  code?: string; // Optional for non-owners
  language: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  testCasesPassed?: number; // For both owners and non-owners
  totalTestCases: number;
  createdAt: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
  user: {
    id: string;
    username: string;
    image: string | null;
  };
  testResults?: TestResult[]; // Optional for non-owners
  isComplete?: boolean;
}

export default function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if came from admin page
  const fromAdmin = searchParams.get("from") === "admin";

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${id}`);
        const data = await response.json();

        if (data.success) {
          setSubmission(data);
        } else {
          console.error("Failed to fetch submission:", data.error);
        }
      } catch (error) {
        console.error("Error fetching submission:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id]);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "ACCEPTED":
        return "text-green-400 bg-green-400/10 border-green-400/20";
      case "REJECTED":
        return "text-red-400 bg-red-400/10 border-red-400/20";
      case "PENDING":
        return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      default:
        return "text-slate-400 bg-slate-400/10 border-slate-400/20";
    }
  };

  const getVerdictText = (verdict: string) => {
    switch (verdict) {
      case "ACCEPTED":
        return "Accepted";
      case "REJECTED":
        return "Rejected";
      case "PENDING":
        return "Pending";
      default:
        return verdict;
    }
  };

  const getStatusText = (statusId?: number) => {
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
  };

  const getStatusColor = (statusId?: number) => {
    if (!statusId) return "text-slate-400";

    switch (statusId) {
      case 3:
        return "text-green-400";
      case 4:
        return "text-red-400";
      case 5:
        return "text-orange-400";
      case 6:
        return "text-purple-400";
      case 7:
      case 8:
      case 9:
      case 10:
      case 11:
      case 12:
      case 20:
        return "text-yellow-400";
      case 13:
        return "text-red-500";
      case 17:
        return "text-orange-500";
      default:
        return "text-slate-400";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "text-green-400";
      case "MEDIUM":
        return "text-yellow-400";
      case "HARD":
        return "text-red-400";
      default:
        return "text-slate-400";
    }
  };

  if (loading) {
    return (
      <PageLoader
        message="Loading submission..."
        subtitle="Fetching submission details"
      />
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 text-lg mb-4">Submission not found</p>
          <button
            onClick={() => router.push("/problems")}
            className="text-purple-400 hover:text-purple-300">
            ← Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (fromAdmin) {
                    router.push("/admin");
                  } else {
                    router.push(`/problems/${submission.problem.slug}`);
                  }
                }}
                className="text-slate-400 hover:text-white transition">
                ← Back to {fromAdmin ? "Admin" : "Problem"}
              </button>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-semibold text-white">
                  {submission.problem.title}
                </h1>
                <span className="text-slate-500">•</span>
                <span
                  className={`text-sm font-medium ${getDifficultyColor(submission.problem.difficulty)}`}>
                  {submission.problem.difficulty}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400 text-sm">
                  {new Date(submission.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span
                className={`px-4 py-2 rounded-lg font-semibold border ${getVerdictColor(submission.verdict)}`}>
                {getVerdictText(submission.verdict)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Statistics
              </h2>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-slate-400 mb-1">Language</div>
                  <div className="text-white font-medium">
                    {submission.language}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Runtime</div>
                  <div className="text-white font-medium">
                    {submission.runtime !== null
                      ? `${submission.runtime}ms`
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">Memory</div>
                  <div className="text-white font-medium">
                    {submission.memory !== null
                      ? `${(submission.memory / 1024).toFixed(1)}KB`
                      : "N/A"}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-slate-400 mb-1">
                    Test Cases Passed
                  </div>
                  <div className="text-white font-medium">
                    {submission.testCasesPassed ?? 0} /{" "}
                    {submission.totalTestCases}
                  </div>
                </div>
              </div>
            </div>

            {/* Test Results Summary */}
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">
                Test Results
              </h2>
              <div className="space-y-2">
                {submission.testResults ? (
                  submission.testResults.map((result, idx) => (
                    <div
                      key={result.testCaseId}
                      className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                      <span className="text-slate-300">
                        Test Case {idx + 1}
                      </span>
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs ${getStatusColor(result.statusId)}`}>
                          {getStatusText(result.statusId)}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            result.passed ? "text-green-400" : "text-red-400"
                          }`}>
                          {result.passed ? "✓ Passed" : "✗ Failed"}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-slate-400">
                      Detailed test results are only visible to the submission
                      owner.
                    </p>
                    <p className="text-slate-500 text-sm mt-2">
                      {submission.testCasesPassed || 0} of{" "}
                      {submission.totalTestCases || 0} tests passed
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Code */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
              <h2 className="text-lg font-semibold text-white mb-4">Code</h2>
              {submission.code ? (
                <pre className="bg-slate-900 rounded-lg p-4 overflow-x-auto text-sm">
                  <code className="text-slate-300">{submission.code}</code>
                </pre>
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    Code is only visible to the submission owner.
                  </p>
                </div>
              )}
            </div>

            {/* Detailed Test Results */}
            <div className="mt-6 space-y-4">
              <h2 className="text-lg font-semibold text-white">
                Detailed Results
              </h2>
              {submission.testResults ? (
                submission.testResults.map((result, idx) => (
                  <div
                    key={result.testCaseId}
                    className={`bg-slate-800/50 rounded-lg p-6 border ${
                      result.passed
                        ? "border-green-900/30"
                        : "border-red-900/30"
                    }`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-semibold">
                        Test Case {idx + 1}
                      </h3>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-400">
                          {result.runtime}ms
                        </span>
                        <span className="text-sm text-slate-400">
                          {(result.memory / 1024).toFixed(1)}KB
                        </span>
                        <span
                          className={`text-sm font-medium ${getStatusColor(result.statusId)}`}>
                          {getStatusText(result.statusId)}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            result.passed ? "text-green-400" : "text-red-400"
                          }`}>
                          {result.passed ? "✓ Passed" : "✗ Failed"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Input:
                        </div>
                        <pre className="bg-slate-900/50 rounded p-3 text-sm text-purple-400 overflow-x-auto">
                          {result.input}
                        </pre>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Your Output:
                        </div>
                        <pre
                          className={`bg-slate-900/50 rounded p-3 text-sm overflow-x-auto ${
                            result.passed ? "text-green-400" : "text-red-400"
                          }`}>
                          {result.output || "(no output)"}
                        </pre>
                      </div>

                      <div>
                        <div className="text-sm text-slate-400 mb-1">
                          Expected Output:
                        </div>
                        <pre className="bg-slate-900/50 rounded p-3 text-sm text-green-400 overflow-x-auto">
                          {result.expectedOutput}
                        </pre>
                      </div>

                      {result.errorMessage && (
                        <div>
                          <div className="text-sm text-slate-400 mb-1">
                            Error:
                          </div>
                          <pre className="bg-slate-900/50 rounded p-3 text-sm text-yellow-400 overflow-x-auto">
                            {result.errorMessage}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400">
                    Detailed test results are only visible to the submission
                    owner.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
