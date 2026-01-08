"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, Trash2, Edit, Eye, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Problem {
  id: string;
  slug: string;
  title: string;
  difficulty: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  _count: {
    testCases: number;
    submissions: number;
  };
}

export default function ProblemsListClient({
  initialProblems,
}: {
  initialProblems: Problem[];
}) {
  const [problems, setProblems] = useState(initialProblems);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("ALL");

  const filteredProblems = useMemo(() => {
    return problems.filter(problem => {
      const matchesSearch = 
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesDifficulty = 
        difficultyFilter === "ALL" || problem.difficulty === difficultyFilter;

      return matchesSearch && matchesDifficulty;
    });
  }, [problems, searchQuery, difficultyFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/problems/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setProblems(problems.filter(p => p.id !== id));
      } else {
        alert("Failed to delete problem");
      }
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-blue-500/50"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition cursor-pointer"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {filteredProblems.map(problem => (
          <div
            key={problem.id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-slate-600 transition">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Link
                    href={`/admin/problems/${problem.slug}`}
                    className="text-xl font-semibold text-white hover:text-blue-400">
                    {problem.title}
                  </Link>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      problem.difficulty === "EASY"
                        ? "bg-green-500/20 text-green-400"
                        : problem.difficulty === "MEDIUM"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-red-500/20 text-red-400"
                    }`}>
                    {problem.difficulty}
                  </span>
                  {!problem.publishedAt && (
                    <span className="text-xs px-2 py-1 rounded bg-slate-500/20 text-slate-400">
                      Draft
                    </span>
                  )}
                  {problem.isPremium && (
                    <span className="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">
                      Premium
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>Slug: {problem.slug}</span>
                  <span>•</span>
                  <span>{problem._count.testCases} test cases</span>
                  <span>•</span>
                  <span>{problem._count.submissions} submissions</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                  <span>
                    Created: {new Date(problem.createdAt).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>
                    Updated: {new Date(problem.updatedAt).toLocaleDateString()}
                  </span>
                  {problem.publishedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Published:{" "}
                        {new Date(problem.publishedAt).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/problems/${problem.slug}?from=admin`}
                  target="_blank"
                  className="p-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-700 transition"
                  title="Preview Problem">
                  <Eye className="w-4 h-4" />
                </Link>
                <Link
                  href={`/admin/problems/${problem.slug}`}
                  className="p-2 text-blue-400 hover:text-blue-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
                  title="Edit Problem">
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => handleDelete(problem.id, problem.title)}
                  disabled={deleting === problem.id}
                  className="p-2 text-red-400 hover:text-red-300 border border-slate-700 rounded-lg hover:bg-slate-700 transition disabled:opacity-50"
                  title="Delete Problem">
                  {deleting === problem.id ? (
                    <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredProblems.length === 0 && (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-800 border-dashed rounded-xl">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg">No problems found matching your criteria</p>
            {(searchQuery || difficultyFilter !== "ALL") && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setDifficultyFilter("ALL");
                }}
                className="mt-4 text-blue-400 hover:text-blue-300 font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
