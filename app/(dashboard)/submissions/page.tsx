"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Code,
  Cpu,
  HardDrive,
  ExternalLink,
  FileText,
} from "lucide-react";

interface Submission {
  id: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  language: string;
  testCasesPassed: number;
  totalTestCases: number;
  submittedAt: string;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const verdictConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  ACCEPTED: {
    label: "Accepted",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    icon: CheckCircle,
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    icon: XCircle,
  },
  TIME_LIMIT_EXCEEDED: {
    label: "Time Limit",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    icon: Clock,
  },
  MEMORY_LIMIT_EXCEEDED: {
    label: "Memory Limit",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    icon: HardDrive,
  },
  RUNTIME_ERROR: {
    label: "Runtime Error",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    icon: AlertCircle,
  },
  COMPILATION_ERROR: {
    label: "Compile Error",
    color: "text-red-400",
    bgColor: "bg-red-400/10",
    icon: Code,
  },
  PENDING: {
    label: "Pending",
    color: "text-zinc-400",
    bgColor: "bg-zinc-500/10",
    icon: Clock,
  },
};

const difficultyColors: Record<string, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-red-500",
};

const languageLabels: Record<string, string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  CPP: "C++",
  JAVA: "Java",
  GO: "Go",
  RUST: "Rust",
};

function VerdictBadge({ verdict }: { verdict: string }) {
  const config = verdictConfig[verdict] || verdictConfig.PENDING;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ${config.bgColor}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}

export default function SubmissionsPage() {
  const { data: session, status } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [languageFilter, setLanguageFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      setLoading(false);
      return;
    }

    async function fetchSubmissions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (verdictFilter !== "ALL") params.set("verdict", verdictFilter);
        if (languageFilter !== "ALL") params.set("language", languageFilter);

        const res = await fetch(`/api/user/submissions?${params}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch");
        }

        setSubmissions(data.submissions);
        setPagination(data.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchSubmissions();
  }, [page, verdictFilter, languageFilter, session?.user, status]);

  const handleFilterChange = () => {
    setPage(1); // Reset to first page on filter change
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Sign in to view submissions
          </h1>
          <p className="text-zinc-400 mb-4">Track your coding progress</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-zinc-400 mb-4">{error}</p>
          <Link
            href="/problems"
            className="text-emerald-500 hover:text-emerald-400">
            ← Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Submissions</h1>
          <p className="text-zinc-400">View all your past code submissions</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-zinc-400" />
              <span className="text-sm text-zinc-400">Filters:</span>
            </div>

            <select
              value={verdictFilter}
              onChange={e => {
                setVerdictFilter(e.target.value);
                handleFilterChange();
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Verdicts</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="WRONG_ANSWER">Wrong Answer</option>
              <option value="TIME_LIMIT_EXCEEDED">Time Limit</option>
              <option value="RUNTIME_ERROR">Runtime Error</option>
              <option value="COMPILATION_ERROR">Compile Error</option>
            </select>

            <select
              value={languageFilter}
              onChange={e => {
                setLanguageFilter(e.target.value);
                handleFilterChange();
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="ALL">All Languages</option>
              <option value="PYTHON">Python</option>
              <option value="JAVASCRIPT">JavaScript</option>
              <option value="CPP">C++</option>
              <option value="JAVA">Java</option>
              <option value="GO">Go</option>
              <option value="RUST">Rust</option>
            </select>

            {pagination && (
              <span className="ml-auto text-sm text-zinc-500">
                {pagination.total} submission{pagination.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </motion.div>

        {/* Submissions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <Code className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No submissions yet
              </h3>
              <p className="text-zinc-400 mb-4">
                Start solving problems to see your submissions here
              </p>
              <Link
                href="/problems"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors">
                Browse Problems
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-zinc-800/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      Problem
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      Verdict
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      Language
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Runtime
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5" />
                        Memory
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-zinc-400">
                      Time
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {submissions.map((submission, index) => (
                    <motion.tr
                      key={submission.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-zinc-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${submission.problem.slug}`}
                          className="hover:text-emerald-500 transition-colors">
                          <span className="text-white font-medium">
                            {submission.problem.title}
                          </span>
                          <span
                            className={`ml-2 text-xs ${difficultyColors[submission.problem.difficulty]}`}>
                            {submission.problem.difficulty}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <VerdictBadge verdict={submission.verdict} />
                        <span className="ml-2 text-xs text-zinc-500">
                          {submission.testCasesPassed}/
                          {submission.totalTestCases}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-300">
                        {languageLabels[submission.language] ||
                          submission.language}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {submission.runtime !== null
                          ? `${submission.runtime} ms`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-400">
                        {submission.memory !== null
                          ? `${(submission.memory / 1024).toFixed(1)} MB`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-zinc-500">
                        {formatTimeAgo(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/submissions/${submission.id}`}
                          className="text-zinc-400 hover:text-white transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        page === pageNum
                          ? "bg-emerald-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                      }`}>
                      {pageNum}
                    </button>
                  );
                },
              )}
            </div>

            <button
              onClick={() =>
                setPage(p => Math.min(pagination.totalPages, p + 1))
              }
              disabled={page === pagination.totalPages}
              className="p-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
