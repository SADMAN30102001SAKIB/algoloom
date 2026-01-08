"use client";

import { useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

interface VisibleTestCase {
  id: string;
  orderIndex: number;
  isHidden: boolean;
  input: string;
  output: string;
}

interface TestResultsPanelProps {
  testCaseResults: TestCaseResult[];
  summary: SubmissionSummary | null;
  currentTestIndex: number;
  totalTestCases: number;
  visibleTestCases?: VisibleTestCase[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  submitting?: boolean;
}

export function TestResultsPanel({
  testCaseResults,
  summary,
  currentTestIndex,
  totalTestCases,
  visibleTestCases,
  isCollapsed,
  onToggleCollapse,
  submitting = false,
}: TestResultsPanelProps) {
  const hasSubmitted =
    testCaseResults.length > 0 || summary !== null || submitting;

  // Auto-expand when submission starts
  useEffect(() => {
    if (submitting && isCollapsed) {
      onToggleCollapse();
    }
  }, [submitting, isCollapsed, onToggleCollapse]);

  return (
    <div
      className={`border-t-2 border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${isCollapsed ? "h-11 overflow-hidden" : "h-2/3"}`}>
      {/* Header */}
      <div
        className={`bg-slate-950/50 px-4 py-2.5 flex-shrink-0 flex items-center justify-between ${!isCollapsed && "border-b border-slate-700"}`}>
        <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 text-sm uppercase tracking-wider">
          Test Results
        </h3>
        <button
          onClick={onToggleCollapse}
          className="p-1 hover:bg-slate-700/50 rounded transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}>
          {isCollapsed ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {!isCollapsed && (
        <div
          className={`overflow-y-auto overflow-x-hidden p-4 space-y-3 ${hasSubmitted ? "pb-16" : ""}`}
          style={{ height: "calc(100% - 3.5rem)" }}>
          {/* Overall Summary */}
          {summary ? (
            <SummarySection summary={summary} />
          ) : (
            <PlaceholderSummary
              totalTestCases={totalTestCases}
              submitting={submitting}
            />
          )}

          {/* Individual Test Cases */}
          <div className="space-y-2">
            {Array.from({ length: totalTestCases }).map((_, index) => {
              const result = testCaseResults.find(
                r => r.testCaseIndex === index,
              );
              const isRunning = hasSubmitted && currentTestIndex === index;
              const isPending =
                hasSubmitted &&
                !result &&
                !isRunning &&
                index > (currentTestIndex >= 0 ? currentTestIndex : -1);

              const visibleTestCase = visibleTestCases?.find(
                tc => tc.orderIndex === index,
              );
              const isHidden = !visibleTestCase;

              return (
                <TestCaseCard
                  key={index}
                  index={index}
                  result={result}
                  isRunning={isRunning}
                  isPending={isPending}
                  isHidden={isHidden}
                  visibleTestCase={visibleTestCase}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PlaceholderSummary({
  totalTestCases,
  submitting,
}: {
  totalTestCases: number;
  submitting?: boolean;
}) {
  return (
    <div className="space-y-3 pb-3 border-b border-slate-700">
      {/* Verdict Badge */}
      <div className="flex items-center gap-2">
        <div className="px-4 py-2 rounded-lg font-bold text-base bg-slate-700 text-slate-400">
          {submitting ? "Submitting..." : "Not Submitted"}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Runtime</div>
          <div className="text-lg font-semibold text-slate-500">-- ms</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Memory</div>
          <div className="text-lg font-semibold text-slate-500">-- KB</div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Test Cases</div>
          <div className="text-lg font-semibold text-slate-500">
            0/{totalTestCases}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummarySection({ summary }: { summary: SubmissionSummary }) {
  return (
    <div className="space-y-3 pb-3 border-b border-slate-700">
      {/* Verdict Badge */}
      <div className="flex items-center gap-2">
        <div
          className={`px-4 py-2 rounded-lg font-bold text-base ${
            summary.verdict === "ACCEPTED"
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
          }`}>
          {summary.verdict === "ACCEPTED"
            ? "Accepted"
            : summary.verdict === "REJECTED"
              ? "Rejected"
              : summary.verdict.replace(/_/g, " ")}
        </div>
      </div>

      {/* Error Message */}
      {summary.errorMessage && (
        <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3">
          <div className="text-sm text-red-400">{summary.errorMessage}</div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Runtime</div>
          <div className="text-lg font-semibold text-blue-400">
            {summary.runtime}ms
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Memory</div>
          <div className="text-lg font-semibold text-purple-400">
            {summary.memory}KB
          </div>
        </div>
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
          <div className="text-xs text-slate-400 mb-1">Test Cases</div>
          <div className="text-lg font-semibold text-green-400">
            {summary.testCasesPassed}/{summary.totalTestCases}
          </div>
        </div>
      </div>

      {/* XP Earned or Already Solved */}
      {summary.verdict === "ACCEPTED" && (
        <div
          className={`bg-gradient-to-r rounded-lg p-3 text-sm ${
            summary.xpEarned > 0
              ? "from-green-500/10 to-emerald-500/10 border border-green-500/30 text-green-400"
              : "from-blue-500/10 to-cyan-500/10 border border-blue-500/30 text-blue-400"
          }`}>
          {summary.xpEarned > 0
            ? `+${summary.xpEarned} XP earned! New Level: ${summary.newLevel}`
            : "Problem already solved! No additional XP awarded."}
        </div>
      )}
    </div>
  );
}

interface TestCaseCardProps {
  index: number;
  result?: TestCaseResult;
  isRunning: boolean;
  isPending: boolean;
  isHidden: boolean;
  visibleTestCase?: VisibleTestCase;
}

function TestCaseCard({
  index,
  result,
  isRunning,
  isPending,
  isHidden,
  visibleTestCase,
}: TestCaseCardProps) {
  // Show I/O data if:
  // 1. Not hidden (visible test case)
  // 2. OR hidden but has result (after verdict)
  const showIOData = !isHidden || !!result;

  return (
    <div
      className={`rounded-lg border p-3 ${
        result?.passed
          ? "bg-green-900/10 border-green-500/30"
          : result && !result.passed
            ? "bg-red-900/10 border-red-500/30"
            : isRunning
              ? "bg-blue-900/10 border-blue-500/30 animate-pulse"
              : "bg-slate-800/30 border-slate-700/50"
      }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-300">
            Test Case {index + 1}
            {isHidden && (
              <span className="ml-2 px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                Hidden
              </span>
            )}
          </span>
          {result && (
            <span
              className={`px-2 py-0.5 rounded text-xs font-bold ${
                result.passed
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}>
              {result.passed ? "AC" : result.statusDescription}
            </span>
          )}
          {isRunning && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">
              Running...
            </span>
          )}
          {isPending && (
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-600 text-slate-300">
              Pending
            </span>
          )}
        </div>
        {result && (
          <div className="flex gap-3 text-xs text-slate-400">
            <span>{result.runtime}ms</span>
            <span>{result.memory}KB</span>
          </div>
        )}
      </div>

      {/* Show I/O Data */}
      {showIOData && (
        <div className="space-y-2 text-xs">
          {result ? (
            // After verdict - show actual results
            <>
              <div>
                <div className="text-slate-400 mb-1">Input:</div>
                <pre className="bg-slate-900/50 p-2 rounded text-slate-300 overflow-x-auto">
                  {result.input}
                </pre>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Your Output:</div>
                <pre
                  className={`p-2 rounded overflow-x-auto ${
                    result.passed
                      ? "bg-green-900/20 text-green-300"
                      : "bg-red-900/20 text-red-300"
                  }`}>
                  {result.output || "(empty)"}
                </pre>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Expected Output:</div>
                <pre className="bg-slate-900/50 p-2 rounded text-slate-300 overflow-x-auto">
                  {result.expectedOutput}
                </pre>
              </div>
              {(result.stderr || result.compileOutput) && (
                <div>
                  <div className="text-red-400 mb-1">Error:</div>
                  <pre className="bg-red-900/20 p-2 rounded text-red-300 overflow-x-auto text-xs">
                    {result.stderr || result.compileOutput}
                  </pre>
                </div>
              )}
            </>
          ) : (
            // Before submission or no result yet - show placeholder for visible cases
            <>
              <div>
                <div className="text-slate-400 mb-1">Input:</div>
                <pre className="bg-slate-900/50 p-2 rounded text-slate-300 overflow-x-auto">
                  {visibleTestCase?.input || "..."}
                </pre>
              </div>
              <div>
                <div className="text-slate-400 mb-1">Expected Output:</div>
                <pre className="bg-slate-900/50 p-2 rounded text-slate-300 overflow-x-auto">
                  {visibleTestCase?.output || "..."}
                </pre>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden case without result - show locked message */}
      {!showIOData && (
        <div className="text-xs text-slate-500 italic text-center py-2">
          Input and output will be revealed after submission
        </div>
      )}
    </div>
  );
}
