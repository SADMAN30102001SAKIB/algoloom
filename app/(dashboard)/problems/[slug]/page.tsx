"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { IOGuideModal } from "@/components/problems/IOGuideModal";
import { TestResultsPanel } from "@/components/problems/TestResultsPanel";
import { ProblemDescription } from "@/components/problems/ProblemDescription";
import { CodeEditorPanel } from "@/components/problems/CodeEditorPanel";
import { useSubmission } from "@/hooks/useSubmission";

interface Submission {
  id: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  language: string;
  createdAt: string;
}

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestCase {
  id: string;
  input: string;
  output: string;
  orderIndex: number;
  isHidden: boolean;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  description: string;
  examples: Example[];
  constraints: string[];
  tags: string[];
  hints: string[];
  acceptanceRate: number;
  testCases: TestCase[];
  totalTestCases: number;
  inputFormat: string;
  outputFormat: string;
  timeLimit: number;
  memoryLimit: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  userSubmissions?: Submission[];
}

export default function ProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if came from admin page
  const fromAdmin = searchParams.get("from") === "admin";
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<
    "premium" | "unpublished" | "notfound" | null
  >(null);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("PYTHON");
  const [showIOGuide, setShowIOGuide] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "description" | "ai-hints" | "submissions" | "solutions"
  >("description");
  const [isOutputCollapsed, setIsOutputCollapsed] = useState(true);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Use submission hook for all submission logic
  const { testCaseResults, currentTestIndex, summary, submitting, submitCode } =
    useSubmission(slug);

  // Trigger confetti on ACCEPTED
  useEffect(() => {
    if (summary?.verdict === "ACCEPTED") {
      const count = 200;
      const defaults = {
        origin: { y: 0.7 },
        zIndex: 9999,
      };

      const fire = (particleRatio: number, opts: Record<string, unknown>) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    }
  }, [summary]);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const response = await fetch(`/api/problems/${slug}`);
        const data = await response.json();

        if (response.status === 403) {
          setError(
            data.error ||
              "This is a premium problem. Upgrade to Pro to access it.",
          );
          setErrorType("premium");
        } else if (response.status === 404) {
          setError(data.error || "Problem not found or not yet published.");
          setErrorType("unpublished");
        } else if (data.success) {
          setProblem(data.problem);
          setCode(""); // Start with empty editor - CodeForces style!
          setErrorType(null);
        } else {
          setError("Problem not found");
          setErrorType("notfound");
        }
      } catch (error) {
        console.error("Failed to fetch problem:", error);
        setError("Failed to load problem");
        setErrorType("notfound");
      } finally {
        setLoading(false);
      }
    };

    fetchProblem();
  }, [slug]);

  const handleSubmit = () => {
    submitCode(code, language, problem?.timeLimit, problem?.memoryLimit);
  };

  const refetchSubmissions = async () => {
    if (!problem) return;

    setSubmissionsLoading(true);
    try {
      const response = await fetch(`/api/problems/${slug}/submissions`);
      const data = await response.json();

      if (data.success) {
        setProblem(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            userSubmissions: data.submissions,
          };
        });
      }
    } catch (error) {
      console.error("Failed to refetch submissions:", error);
    } finally {
      setSubmissionsLoading(false);
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

  const handleSubmissionDeleted = () => {
    // Refetch submissions after deletion
    refetchSubmissions();
  };

  const handleTabChange = (
    tab: "description" | "ai-hints" | "submissions" | "solutions",
  ) => {
    setActiveTab(tab);
    // Refetch submissions when switching to submissions tab
    if (tab === "submissions") {
      refetchSubmissions();
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 border-r-purple-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-white text-xl font-medium">
            Loading problem...
          </div>
          <div className="text-slate-500 text-sm mt-2">
            Preparing your coding environment
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isPremiumError = errorType === "premium";
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">{isPremiumError ? "🔒" : "📝"}</div>
          <h1 className="text-2xl text-white mb-2">
            {isPremiumError ? "Premium Problem" : "Problem Unavailable"}
          </h1>
          <p className="text-slate-400 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => router.push("/problems")}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition">
              Back to Problems
            </button>
            {isPremiumError && (
              <button
                onClick={() => router.push("/pricing")}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-lg transition font-semibold">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-white mb-4">Problem not found</h1>
          <button
            onClick={() => router.push("/problems")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition">
            Back to Problems
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-800/50 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (fromAdmin) {
                router.push("/admin");
              } else {
                router.push("/problems");
              }
            }}
            className="text-slate-400 hover:text-white transition">
            ← Back to {fromAdmin ? "Admin" : "Problems"}
          </button>
          <h1 className="text-lg font-semibold text-white">{problem.title}</h1>
          <span
            className={`text-sm font-medium ${getDifficultyColor(problem.difficulty)}`}>
            {problem.difficulty}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="text-sm text-slate-400">
            Acceptance: {problem.acceptanceRate.toFixed(1)}%
          </span>
          <span>•</span>
          <span className="text-xs text-slate-500">
            Updated: {new Date(problem.updatedAt).toLocaleDateString()}
          </span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Problem Description */}
        <ProblemDescription
          problem={problem}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSubmissionDeleted={handleSubmissionDeleted}
          submissionsLoading={submissionsLoading}
          isAuthenticated={!!session}
          currentCode={code}
          currentLanguage={language}
        />

        {/* Right Panel - Code Editor */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <CodeEditorPanel
            language={language}
            code={code}
            submitting={submitting}
            hasResults={testCaseResults.length > 0 || summary !== null}
            isOutputCollapsed={isOutputCollapsed}
            onLanguageChange={setLanguage}
            onCodeChange={setCode}
            onSubmit={handleSubmit}
            onShowIOGuide={() => setShowIOGuide(true)}
          />

          {/* Output Panel - Always visible after problem loads */}
          {problem && (
            <TestResultsPanel
              testCaseResults={testCaseResults}
              summary={summary}
              currentTestIndex={currentTestIndex}
              totalTestCases={
                summary?.totalTestCases || problem.totalTestCases || 0
              }
              visibleTestCases={problem.testCases}
              isCollapsed={isOutputCollapsed}
              onToggleCollapse={() => setIsOutputCollapsed(!isOutputCollapsed)}
              submitting={submitting}
            />
          )}
        </div>
      </div>

      {/* I/O Guide Modal */}
      {showIOGuide && (
        <IOGuideModal
          language={language}
          onClose={() => setShowIOGuide(false)}
        />
      )}
    </div>
  );
}
