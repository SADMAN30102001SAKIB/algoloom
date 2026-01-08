"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Link from "next/link";
import { AIHintsTab } from "./AIHintsTab";

interface Submission {
  id: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  language: string;
  createdAt: string;
}

interface SolutionData {
  success: boolean;
  isSameSolution?: boolean;
  bestRuntime: {
    id: string;
    code: string;
    language: string;
    runtime: number;
    memory: number;
    username: string;
    submittedAt: Date;
  } | null;
  bestMemory: {
    id: string;
    code: string;
    language: string;
    runtime: number;
    memory: number;
    username: string;
    submittedAt: Date;
  } | null;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  testCases: {
    id: string;
    input: string;
    output: string;
    orderIndex: number;
  }[];
  tags: string[];
  timeLimit?: number;
  memoryLimit?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string | null;
  userSubmissions?: Submission[];
}

interface ProblemDescriptionProps {
  problem: Problem;
  activeTab: "description" | "ai-hints" | "submissions" | "solutions";
  onTabChange: (
    tab: "description" | "ai-hints" | "submissions" | "solutions",
  ) => void;
  onSubmissionDeleted?: (submissionId: string) => void;
  submissionsLoading?: boolean;
  isAuthenticated?: boolean;
  currentCode?: string;
  currentLanguage?: string;
}

export function ProblemDescription({
  problem,
  activeTab,
  onTabChange,
  onSubmissionDeleted,
  submissionsLoading = false,
  isAuthenticated = false,
  currentCode = "",
  currentLanguage = "PYTHON",
}: ProblemDescriptionProps) {
  return (
    <div className="w-1/2 h-full border-r border-slate-700 overflow-y-auto min-h-0 bg-slate-900">
      <div className="p-6">
        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-slate-700">
          <TabButton
            active={activeTab === "description"}
            onClick={() => onTabChange("description")}>
            Description
          </TabButton>
          <TabButton
            active={activeTab === "ai-hints"}
            onClick={() => onTabChange("ai-hints")}>
            🤖 AI Hints
          </TabButton>
          <TabButton
            active={activeTab === "submissions"}
            onClick={() => onTabChange("submissions")}>
            Submissions
          </TabButton>
          <TabButton
            active={activeTab === "solutions"}
            onClick={() => onTabChange("solutions")}>
            Solutions
          </TabButton>
        </div>

        {activeTab === "description" && (
          <DescriptionTab problem={problem} isAuthenticated={isAuthenticated} />
        )}
        {activeTab === "ai-hints" && (
          <AIHintsTab
            problemId={problem.id}
            currentCode={currentCode}
            currentLanguage={currentLanguage}
          />
        )}
        {activeTab === "submissions" && (
          <SubmissionsTab
            submissions={problem.userSubmissions}
            onSubmissionDeleted={onSubmissionDeleted}
            loading={submissionsLoading}
          />
        )}
        {activeTab === "solutions" && (
          <SolutionsTab problemSlug={problem.slug} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 px-1 font-medium transition border-b-2 ${
        active
          ? "text-white border-purple-500"
          : "text-slate-400 border-transparent hover:text-white"
      }`}>
      {children}
    </button>
  );
}

function DescriptionTab({
  problem,
  isAuthenticated,
}: {
  problem: Problem;
  isAuthenticated: boolean;
}) {
  const [hintUsedMarked, setHintUsedMarked] = useState(false);

  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">Description</h2>
        <div
          className="text-slate-300 prose prose-invert prose-slate max-w-none 
          prose-p:text-slate-300 prose-p:leading-relaxed
          prose-strong:text-white prose-strong:font-semibold
          prose-code:text-blue-400 prose-code:bg-slate-800 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
          prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700
          prose-ul:text-slate-300 prose-ol:text-slate-300
          prose-li:text-slate-300 prose-li:marker:text-slate-500
          prose-headings:text-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.description}
          </ReactMarkdown>
        </div>
      </div>

      {/* Examples */}
      {problem.examples && problem.examples.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Examples</h2>
          {problem.examples.map((example, idx: number) => (
            <div
              key={idx}
              className="mb-4 bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <p className="text-sm text-slate-400 mb-2">Example {idx + 1}:</p>
              <div className="space-y-2">
                <div>
                  <div className="text-slate-400 mb-1">Input:</div>
                  <pre className="text-purple-400 bg-slate-900/50 px-3 py-2 rounded text-sm whitespace-pre">
                    {typeof example.input === "string"
                      ? example.input
                      : JSON.stringify(example.input)}
                  </pre>
                </div>
                <div>
                  <div className="text-slate-400 mb-1">Output:</div>
                  <pre className="text-green-400 bg-slate-900/50 px-3 py-2 rounded text-sm whitespace-pre">
                    {typeof example.output === "string"
                      ? example.output
                      : JSON.stringify(example.output)}
                  </pre>
                </div>
                {example.explanation && (
                  <div>
                    <span className="text-slate-400">Explanation: </span>
                    <span className="text-slate-300">
                      {example.explanation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Constraints */}
      {problem.constraints && problem.constraints.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">Constraints</h2>
          <ul className="space-y-2">
            {problem.constraints.map((constraint: string, idx: number) => (
              <li key={idx} className="text-slate-300 flex items-start">
                <span className="text-purple-400 mr-2">•</span>
                <span>{constraint}</span>
              </li>
            ))}
          </ul>

          {/* Time & Memory Limits */}
          {(problem.timeLimit || problem.memoryLimit) && (
            <div className="mt-4 flex gap-6 text-sm">
              {problem.timeLimit && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Time Limit:</span>
                  <span className="text-blue-400 font-mono">
                    {problem.timeLimit < 1000
                      ? `${problem.timeLimit}ms`
                      : `${(problem.timeLimit / 1000).toFixed(1)}s`}
                  </span>
                </div>
              )}
              {problem.memoryLimit && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Memory Limit:</span>
                  <span className="text-green-400 font-mono">
                    {problem.memoryLimit >= 1024
                      ? `${(problem.memoryLimit / 1024).toFixed(0)}MB`
                      : `${problem.memoryLimit}KB`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Hints */}
      {isAuthenticated && problem.hints && problem.hints.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">💡 Hints</h2>
          <div className="space-y-3">
            {problem.hints.map((hint: string, idx: number) => (
              <details
                key={idx}
                onToggle={e => {
                  // Mark hints as used when any hint is opened for the first time
                  if (
                    (e.target as HTMLDetailsElement).open &&
                    !hintUsedMarked
                  ) {
                    setHintUsedMarked(true);
                    fetch(`/api/problems/${problem.slug}/mark-hint-used`, {
                      method: "POST",
                    }).catch(console.error);
                  }
                }}
                className="bg-slate-800/50 rounded-lg border border-slate-700 group">
                <summary className="cursor-pointer px-4 py-3 text-slate-300 hover:text-white transition-colors list-none flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="text-yellow-400">💡</span>
                    <span>Hint {idx + 1}</span>
                  </span>
                  <span className="text-slate-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-3 pt-1 text-slate-300 border-t border-slate-700">
                  {hint}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}

      {/* Test Cases (visible ones) */}
      {problem.testCases && problem.testCases.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-3">
            Sample Test Cases
          </h2>
          <div className="space-y-3">
            {problem.testCases.map((testCase, idx: number) => (
              <div
                key={testCase.id}
                className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-3">
                  Test Case {idx + 1}:
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-slate-400">Input: </span>
                    <pre className="mt-1 bg-slate-900/50 p-2 rounded text-purple-400 overflow-x-auto">
                      {testCase.input}
                    </pre>
                  </div>
                  <div>
                    <span className="text-slate-400">Expected Output: </span>
                    <pre className="mt-1 bg-slate-900/50 p-2 rounded text-green-400 overflow-x-auto">
                      {testCase.output}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-3">Tags</h2>
        <div className="flex flex-wrap gap-2">
          {problem.tags.map((tag: string, idx: number) => (
            <span
              key={idx}
              className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-full text-sm">
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Timestamps */}
      {(problem.createdAt || problem.updatedAt || problem.publishedAt) && (
        <div className="pt-4 border-t border-slate-700">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            {problem.createdAt && (
              <span>
                Created: {new Date(problem.createdAt).toLocaleDateString()}
              </span>
            )}
            {problem.updatedAt && (
              <span>
                Last Updated: {new Date(problem.updatedAt).toLocaleDateString()}
              </span>
            )}
            {problem.publishedAt && (
              <span>
                Published: {new Date(problem.publishedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SubmissionsTab({
  submissions,
  onSubmissionDeleted,
  loading = false,
}: {
  submissions?: Submission[];
  onSubmissionDeleted?: (submissionId: string) => void;
  loading?: boolean;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (e: React.MouseEvent, submissionId: string) => {
    e.stopPropagation(); // Prevent opening submission

    if (!confirm("Are you sure you want to delete this submission?")) {
      return;
    }

    setDeletingId(submissionId);

    try {
      const response = await fetch(`/api/submissions/${submissionId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Notify parent component to refetch
        onSubmissionDeleted?.(submissionId);
      } else {
        alert(data.error || "Failed to delete submission");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete submission");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Loading submissions...</p>
      </div>
    );
  }

  if (!submissions || submissions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No submissions yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Submit your code to see your submission history here
        </p>
      </div>
    );
  }

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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">
          Your Submissions ({submissions.length})
        </h2>
      </div>

      <div className="space-y-2">
        {submissions.map(submission => (
          <div
            key={submission.id}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition group">
            <div className="flex items-center justify-between">
              <div
                className="flex items-center gap-3 flex-1 cursor-pointer"
                onClick={() =>
                  window.open(`/submissions/${submission.id}`, "_blank")
                }>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium border ${getVerdictColor(submission.verdict)}`}>
                  {getVerdictText(submission.verdict)}
                </span>
                <span className="text-slate-400 text-sm">
                  {submission.language}
                </span>
              </div>

              <div className="flex items-center gap-4 text-sm">
                {submission.runtime !== null && (
                  <span className="text-slate-300">{submission.runtime}ms</span>
                )}
                {submission.memory !== null && (
                  <span className="text-slate-300">
                    {(submission.memory / 1024).toFixed(1)}KB
                  </span>
                )}
                <span className="text-slate-500">
                  {formatTime(submission.createdAt)}
                </span>

                {/* Delete button */}
                <button
                  onClick={e => handleDelete(e, submission.id)}
                  disabled={deletingId === submission.id}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-2 hover:bg-red-500/20 rounded text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Delete submission">
                  {deletingId === submission.id ? (
                    <span className="text-sm">...</span>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SolutionsTab({ problemSlug }: { problemSlug: string }) {
  const [loading, setLoading] = useState(true);
  const [solutions, setSolutions] = useState<SolutionData | null>(null);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch(`/api/problems/${problemSlug}/solutions`);
        const data = await response.json();
        if (data.success) {
          setSolutions(data);
        }
      } catch (error) {
        console.error("Failed to fetch solutions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSolutions();
  }, [problemSlug]);

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Loading solutions...</p>
      </div>
    );
  }

  if (!solutions?.bestRuntime) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">No solutions available yet</p>
        <p className="text-slate-500 text-sm mt-2">
          Be the first to solve this problem!
        </p>
      </div>
    );
  }

  const { bestRuntime, bestMemory, isSameSolution } = solutions;

  const getLanguageColor = (lang: string) => {
    const colors: Record<string, string> = {
      PYTHON: "text-blue-400 bg-blue-400/10",
      CPP: "text-purple-400 bg-purple-400/10",
      JAVASCRIPT: "text-yellow-400 bg-yellow-400/10",
      JAVA: "text-red-400 bg-red-400/10",
    };
    return colors[lang] || "text-slate-400 bg-slate-400/10";
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-slate-400 mb-4">
        {isSameSolution
          ? "This solution has both the best runtime and memory!"
          : "Showing the fastest and most memory-efficient solutions"}
      </div>

      {/* Best Runtime Solution */}
      <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white">
              {isSameSolution ? "Best Solution" : "Fastest Runtime"}
            </h3>
            <span
              className={`px-2 py-1 rounded text-xs ${getLanguageColor(bestRuntime.language)}`}>
              {bestRuntime.language}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-green-400 font-mono">
              {bestRuntime.runtime}ms
            </span>
            <span className="text-blue-400 font-mono">
              {(bestRuntime.memory / 1024).toFixed(1)}KB
            </span>
          </div>
        </div>

        <div className="mb-3 text-sm text-slate-400">
          by{" "}
          <Link
            href={`/profile/${bestRuntime.username}`}
            className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
            @{bestRuntime.username}
          </Link>
          {" · "}
          <span className="text-slate-500">
            {new Date(bestRuntime.submittedAt).toLocaleDateString()}
          </span>
        </div>

        <pre className="bg-slate-900 rounded p-4 overflow-x-auto text-sm text-slate-300 border border-slate-700">
          <code>{bestRuntime.code}</code>
        </pre>
      </div>

      {/* Best Memory Solution (if different) */}
      {!isSameSolution && bestMemory && (
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-white">
                Most Memory Efficient
              </h3>
              <span
                className={`px-2 py-1 rounded text-xs ${getLanguageColor(bestMemory.language)}`}>
                {bestMemory.language}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-green-400 font-mono">
                {bestMemory.runtime}ms
              </span>
              <span className="text-blue-400 font-mono">
                {(bestMemory.memory / 1024).toFixed(1)}KB
              </span>
            </div>
          </div>

          <div className="mb-3 text-sm text-slate-400">
            by{" "}
            <Link
              href={`/profile/${bestMemory.username}`}
              className="text-purple-400 font-medium hover:text-purple-300 transition-colors">
              @{bestMemory.username}
            </Link>
            {" · "}
            <span className="text-slate-500">
              {new Date(bestMemory.submittedAt).toLocaleDateString()}
            </span>
          </div>

          <pre className="bg-slate-900 rounded p-4 overflow-x-auto text-sm text-slate-300 border border-slate-700">
            <code>{bestMemory.code}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
