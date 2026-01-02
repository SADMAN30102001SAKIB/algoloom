import prisma from "@/lib/prisma";
import ProblemsListClient from "./ProblemsListClient";
import Link from "next/link";

export default async function AdminProblemsPage() {
  const problems = await prisma.problem.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      isPremium: true,
      createdAt: true,
      updatedAt: true,
      publishedAt: true,
      _count: {
        select: { testCases: true, submissions: true },
      },
    },
  });

  // Transform Date objects to ISO strings for client
  const transformedProblems = problems.map(problem => ({
    ...problem,
    createdAt: problem.createdAt.toISOString(),
    updatedAt: problem.updatedAt.toISOString(),
    publishedAt: problem.publishedAt?.toISOString() || null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Problems</h1>
          <p className="text-slate-400">
            Manage all problems, test cases, and examples
          </p>
        </div>
        <Link
          href="/admin/problems/new"
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition">
          + New Problem
        </Link>
      </div>

      <ProblemsListClient initialProblems={transformedProblems} />
    </div>
  );
}
