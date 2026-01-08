"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Search,
  Zap,
  Target,
  AlertCircle,
  CheckCircle,
  Filter,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
}

interface Challenge {
  id: string;
  date: string;
  xpBonus: number;
  problem: Problem;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const difficultyColors: Record<string, string> = {
  EASY: "text-green-400 bg-green-400/10",
  MEDIUM: "text-yellow-400 bg-yellow-400/10",
  HARD: "text-red-400 bg-red-400/10",
};

export default function DailyChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedProblem, setSelectedProblem] = useState<string>("");
  const [xpBonus, setXpBonus] = useState<number>(20);
  const [searchProblem, setSearchProblem] = useState("");
  const [searchChallenges, setSearchChallenges] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("ALL");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChallenges(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchChallenges, difficultyFilter]);

  async function fetchChallenges(page = 1) {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
        search: searchChallenges,
        difficulty: difficultyFilter,
      });
      const res = await fetch(`/api/admin/daily-challenges?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setChallenges(data.challenges);
        setProblems(data.problems);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch challenges:", error);
    } finally {
      setLoading(false);
    }
  }

  async function scheduleChallenge() {
    if (!selectedDate || !selectedProblem) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/daily-challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          problemId: selectedProblem,
          xpBonus,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        setShowScheduleModal(false);
        setSelectedDate("");
        setSelectedProblem("");
        setXpBonus(20);
        fetchChallenges(pagination?.page || 1);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to schedule challenge" });
    } finally {
      setSaving(false);
    }
  }

  async function deleteChallenge(id: string) {
    if (!confirm("Delete this challenge? Auto-generation will take over."))
      return;

    try {
      const res = await fetch(`/api/admin/daily-challenges?id=${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: data.message });
        fetchChallenges(pagination?.page || 1);
      } else {
        setMessage({ type: "error", text: data.error });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete challenge" });
    }
  }

  const today = new Date().toISOString().split("T")[0];

  const filteredProblems = problems.filter(
    p =>
      p.title.toLowerCase().includes(searchProblem.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchProblem.toLowerCase()),
  );

  // Clear message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-cyan-500" />
            Daily Challenges
          </h1>
          <p className="text-slate-400 mt-1">
            Schedule daily challenges or let auto-generation handle it
          </p>
        </div>
        <button
          onClick={() => setShowScheduleModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
          <Plus className="w-4 h-4" />
          Schedule Challenge
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === "success"
              ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
              : "bg-red-500/10 text-red-500 border border-red-500/20"
          }`}>
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-xl">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by problem title or slug..."
            value={searchChallenges}
            onChange={(e) => setSearchChallenges(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50"
          />
          {searchChallenges && (
            <button 
              onClick={() => setSearchChallenges("")}
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
            className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition cursor-pointer"
          >
            <option value="ALL">All Difficulties</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-white">How it works</h3>
            <p className="text-sm text-slate-400 mt-1">
              If you schedule a challenge for a date, that problem will be used.
              If not, the system automatically picks a problem that hasn&apos;t
              been used recently. Users get bonus XP for completing the daily
              challenge.
            </p>
          </div>
        </div>
      </div>

      {/* Challenges Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="text-left p-4 text-slate-400 font-medium">Date</th>
              <th className="text-left p-4 text-slate-400 font-medium">
                Problem
              </th>
              <th className="text-left p-4 text-slate-400 font-medium">
                Difficulty
              </th>
              <th className="text-left p-4 text-slate-400 font-medium">
                XP Bonus
              </th>
              <th className="text-right p-4 text-slate-400 font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {challenges.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-slate-400 text-lg">No challenges found</p>
                    {(searchChallenges || difficultyFilter !== "ALL") && (
                      <button 
                        onClick={() => {
                          setSearchChallenges("");
                          setDifficultyFilter("ALL");
                        }}
                        className="text-cyan-500 hover:text-cyan-400 font-medium"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              challenges.map(challenge => {
                const challengeDate = new Date(challenge.date)
                  .toISOString()
                  .split("T")[0];
                const isToday = challengeDate === today;
                const isPast = challengeDate < today;

                return (
                  <tr
                    key={challenge.id}
                    className={`border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors ${
                      isToday ? "bg-cyan-500/5" : ""
                    }`}>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${isToday ? "text-cyan-500" : "text-white"}`}>
                          {new Date(challenge.date).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-500 rounded-full">
                            Today
                          </span>
                        )}
                        {isPast && !isToday && (
                          <span className="px-2 py-0.5 text-xs bg-slate-700 text-slate-400 rounded-full">
                            Past
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/problems/${challenge.problem.slug}`}
                        className="text-white hover:text-cyan-400 transition-colors">
                        {challenge.problem.title}
                      </Link>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${difficultyColors[challenge.problem.difficulty]}`}>
                        {challenge.problem.difficulty}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-amber-500">
                        <Zap className="w-4 h-4" />+{challenge.xpBonus} XP
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => deleteChallenge(challenge.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete (auto-generation will take over)">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {(pagination.page - 1) * pagination.limit + 1}-
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
            {pagination.total} challenges
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchChallenges(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-slate-400 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchChallenges(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-500" />
                Schedule Daily Challenge
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  min={today}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              {/* Problem Search */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Problem
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search problems..."
                    value={searchProblem}
                    onChange={e => setSearchProblem(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
                <select
                  value={selectedProblem}
                  onChange={e => setSelectedProblem(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  size={6}>
                  <option value="">Select a problem...</option>
                  {filteredProblems.map(problem => (
                    <option key={problem.id} value={problem.id}>
                      [{problem.difficulty}] {problem.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* XP Bonus */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  XP Bonus
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={xpBonus}
                    onChange={e =>
                      setXpBonus(Math.max(0, parseInt(e.target.value) || 0))
                    }
                    min={0}
                    max={100}
                    className="w-24 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-slate-400">XP</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={scheduleChallenge}
                disabled={!selectedDate || !selectedProblem || saving}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4" />
                    Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
