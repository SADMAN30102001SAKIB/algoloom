import Link from "next/link";
import prisma from "@/lib/prisma";
import { FileCode, Users, Send, CheckCircle } from "lucide-react";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;

  // Get stats
  const [problemCount, userCount, submissionCount, totalTestCases] =
    await Promise.all([
      prisma.problem.count(),
      prisma.user.count(),
      prisma.submission.count(),
      prisma.testCase.count(),
    ]);

  // Pagination for recent submissions
  const page = parseInt(pageParam || "1");
  const submissionsPerPage = 5;
  const skip = (page - 1) * submissionsPerPage;

  const recentSubmissions = await prisma.submission.findMany({
    skip,
    take: submissionsPerPage,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { username: true } },
      problem: { select: { title: true, slug: true } },
    },
  });

  // Get total submissions count for pagination
  const totalSubmissions = await prisma.submission.count();
  const totalPages = Math.ceil(totalSubmissions / submissionsPerPage);

  const recentProblems = await prisma.problem.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { submissions: true, testCases: true },
      },
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Welcome to the admin panel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Problems"
          value={problemCount}
          icon={
            <FileCode className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          }
          href="/admin/problems"
        />
        <StatCard
          title="Total Users"
          value={userCount}
          icon={
            <Users className="w-10 h-10 text-purple-400 group-hover:text-purple-300 transition-colors" />
          }
          href="/admin/users"
        />
        <StatCard
          title="Submissions"
          value={submissionCount}
          icon={
            <Send className="w-10 h-10 text-green-400 group-hover:text-green-300 transition-colors" />
          }
          href="/admin/submissions"
        />
        <StatCard
          title="Test Cases"
          value={totalTestCases}
          icon={
            <CheckCircle className="w-10 h-10 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
          }
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Problems */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Recent Problems
            </h2>
            <Link
              href="/admin/problems/new"
              className="text-sm text-blue-400 hover:text-blue-300">
              + Add New
            </Link>
          </div>
          <div className="space-y-3">
            {recentProblems.map(problem => (
              <div
                key={problem.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
                <div>
                  <Link
                    href={`/admin/problems/${problem.slug}`}
                    className="text-white hover:text-blue-400 font-medium">
                    {problem.title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        problem.difficulty === "EASY"
                          ? "bg-green-500/20 text-green-400"
                          : problem.difficulty === "MEDIUM"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                      }`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-xs text-slate-400">
                      {problem._count.testCases} test cases
                    </span>
                    <span className="text-xs text-slate-400">
                      {problem._count.submissions} submissions
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">
              Recent Submissions
            </h2>
            <div className="text-sm text-slate-400">
              Page {page} of {totalPages}
            </div>
          </div>
          <div className="space-y-3">
            {recentSubmissions.map(sub => (
              <div
                key={sub.id}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-300">{sub.user.username}</span>
                    <span className="text-slate-500">→</span>
                    <Link
                      href={`/submissions/${sub.id}?from=admin`}
                      className="text-blue-400 hover:text-blue-300">
                      {sub.problem.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        sub.verdict === "ACCEPTED"
                          ? "bg-green-500/20 text-green-400"
                          : sub.verdict === "REJECTED"
                            ? "bg-red-500/20 text-red-400"
                            : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                      {sub.verdict}
                    </span>
                    <span className="text-xs text-slate-400">
                      {sub.language}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(sub.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
              {page > 1 ? (
                <Link
                  href={`?page=${page - 1}`}
                  className="text-sm px-3 py-1 rounded text-blue-400 hover:text-blue-300 hover:bg-slate-700/50">
                  ← Previous
                </Link>
              ) : (
                <span className="text-sm px-3 py-1 rounded text-slate-500 cursor-not-allowed">
                  ← Previous
                </span>
              )}

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Link
                      key={pageNum}
                      href={`?page=${pageNum}`}
                      className={`text-sm px-2 py-1 rounded ${
                        pageNum === page
                          ? "bg-blue-500/20 text-blue-400"
                          : "text-slate-400 hover:text-blue-400 hover:bg-slate-700/50"
                      }`}>
                      {pageNum}
                    </Link>
                  );
                })}
                {totalPages > 5 && (
                  <>
                    <span className="text-slate-500 mx-1">...</span>
                    <Link
                      href={`?page=${totalPages}`}
                      className="text-sm px-2 py-1 rounded text-slate-400 hover:text-blue-400 hover:bg-slate-700/50">
                      {totalPages}
                    </Link>
                  </>
                )}
              </div>

              {page < totalPages ? (
                <Link
                  href={`?page=${page + 1}`}
                  className="text-sm px-3 py-1 rounded text-blue-400 hover:text-blue-300 hover:bg-slate-700/50">
                  Next →
                </Link>
              ) : (
                <span className="text-sm px-3 py-1 rounded text-slate-500 cursor-not-allowed">
                  Next →
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  href,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className="p-3 rounded bg-transparent flex items-center justify-center transform transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>
      </div>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 group hover:border-blue-500/50 hover:bg-slate-700/50 transition">
        {content}
      </Link>
    );
  }

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 group hover:border-blue-500/50 hover:bg-slate-700/50 transition">
      {content}
    </div>
  );
}
