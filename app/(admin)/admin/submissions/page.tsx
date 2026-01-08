"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
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
  Search,
  Eye,
} from "lucide-react";

interface Submission {
  id: string;
  code: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  language: string;
  testCasesPassed: number;
  totalTestCases: number;
  submittedAt: string;
  user: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
  };
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
  REJECTED: {
    label: "Rejected",
    color: "text-red-500",
    bgColor: "bg-red-500/10",
    icon: XCircle,
  },
  PENDING: {
    label: "Pending",
    color: "text-slate-400",
    bgColor: "bg-slate-500/10",
    icon: Clock,
  },
};

const difficultyColors: Record<string, string> = {
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
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

export default function AdminSubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [verdictFilter, setVerdictFilter] = useState("ALL");
  const [languageFilter, setLanguageFilter] = useState("ALL");
  const [usernameSearch, setUsernameSearch] = useState("");
  const [problemSearch, setProblemSearch] = useState("");
  const [page, setPage] = useState(1);

  // Code preview modal
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [previewLanguage, setPreviewLanguage] = useState<string>("");

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", "20");
        if (verdictFilter !== "ALL") params.set("verdict", verdictFilter);
        if (languageFilter !== "ALL") params.set("language", languageFilter);
        if (usernameSearch) params.set("username", usernameSearch);
        if (problemSearch) params.set("problem", problemSearch);

        const res = await fetch(`/api/admin/submissions?${params}`);
        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/login");
            return;
          }
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
  }, [
    page,
    verdictFilter,
    languageFilter,
    usernameSearch,
    problemSearch,
    router,
  ]);

  const handleSearch = () => {
    setPage(1);
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <Link href="/admin" className="text-blue-400 hover:text-blue-300">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            All Submissions
          </h1>
          <p className="text-slate-400">View and manage all user submissions</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filters:</span>
            </div>

            <select
              value={verdictFilter}
              onChange={e => {
                setVerdictFilter(e.target.value);
                handleSearch();
              }}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All Verdicts</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
              <option value="PENDING">Pending</option>
            </select>

            <select
              value={languageFilter}
              onChange={e => {
                setLanguageFilter(e.target.value);
                handleSearch();
              }}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All Languages</option>
              <option value="PYTHON">Python</option>
              <option value="JAVASCRIPT">JavaScript</option>
              <option value="CPP">C++</option>
              <option value="JAVA">Java</option>
              <option value="GO">Go</option>
              <option value="RUST">Rust</option>
            </select>

            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Username..."
                value={usernameSearch}
                onChange={e => setUsernameSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Problem slug..."
                value={problemSearch}
                onChange={e => setProblemSearch(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
              />
            </div>

            {pagination && (
              <span className="ml-auto text-sm text-slate-500">
                {pagination.total} submission{pagination.total !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-20">
              <Code className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                No submissions found
              </h3>
              <p className="text-slate-400">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Problem
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Verdict
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Language
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      <span className="flex items-center gap-1">
                        <Cpu className="w-3.5 h-3.5" />
                        Runtime
                      </span>
                    </th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">
                      Time
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {submissions.map(submission => (
                    <tr
                      key={submission.id}
                      className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/profile/${submission.user.username}`}
                          className="flex items-center gap-2 hover:text-blue-400 transition-colors">
                          {submission.user.image ? (
                            <Image
                              src={submission.user.image}
                              alt={submission.user.username}
                              width={24}
                              height={24}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                              <span className="text-xs text-slate-400">
                                {submission.user.username[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                          <span className="text-white text-sm">
                            {submission.user.username}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/problems/${submission.problem.slug}`}
                          className="hover:text-blue-400 transition-colors">
                          <span className="text-white text-sm">
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
                        <span className="ml-2 text-xs text-slate-500">
                          {submission.testCasesPassed}/
                          {submission.totalTestCases}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-300">
                        {languageLabels[submission.language] ||
                          submission.language}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-400">
                        {submission.runtime !== null
                          ? `${submission.runtime} ms`
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {formatTimeAgo(submission.submittedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setPreviewCode(submission.code);
                              setPreviewLanguage(submission.language);
                            }}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="Preview code">
                            <Eye className="w-4 h-4" />
                          </button>
                          <Link
                            href={`/submissions/${submission.id}?from=admin`}
                            className="text-slate-400 hover:text-white transition-colors"
                            title="View full details">
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                          ? "bg-blue-600 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
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
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Code Preview Modal */}
        {previewCode && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewCode(null)}>
            <div
              className="bg-slate-900 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
                <span className="text-white font-medium">
                  Code Preview (
                  {languageLabels[previewLanguage] || previewLanguage})
                </span>
                <button
                  onClick={() => setPreviewCode(null)}
                  className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </div>
              <pre className="p-4 overflow-auto max-h-[70vh] text-sm text-slate-300 font-mono">
                {previewCode}
              </pre>
            </div>
          </div>
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
