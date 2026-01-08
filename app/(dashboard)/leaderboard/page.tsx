"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/ui/PageLoader";
import { Spinner } from "@/components/ui/Spinner";
import {
  Trophy,
  Medal,
  Crown,
  ChevronLeft,
  ChevronRight,
  Target,
} from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string | null;
  username: string;
  image: string | null;
  xp: number;
  level: number;
  problemsSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  achievementsCount: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

const timeframes = [
  { value: "all-time", label: "All Time" },
  { value: "monthly", label: "This Month" },
  { value: "weekly", label: "This Week" },
];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20">
        <Crown className="w-5 h-5 text-amber-500" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-400/20">
        <Medal className="w-5 h-5 text-slate-400" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-700/20">
        <Medal className="w-5 h-5 text-amber-700" />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-8 h-8">
      <span className="text-slate-400 font-medium">{rank}</span>
    </div>
  );
}

function LeaderboardRow({
  entry,
  index,
}: {
  entry: LeaderboardEntry;
  index: number;
}) {
  const isTopThree = entry.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}>
      <Link
        href={`/profile/${entry.username}`}
        className={`flex items-center gap-4 p-4 transition-colors ${
          isTopThree
            ? "bg-slate-800/50 hover:bg-slate-800"
            : "hover:bg-slate-800/50"
        }`}>
        {/* Rank */}
        <RankBadge rank={entry.rank} />

        {/* Avatar */}
        <div className="flex-shrink-0">
          {entry.image ? (
            <Image
              src={entry.image}
              alt={entry.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-lg font-bold text-slate-500">
                {entry.username[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-white truncate">
            {entry.name || entry.username}
          </p>
          <p className="text-sm text-slate-500">@{entry.username}</p>
        </div>

        {/* Stats */}
        <div className="hidden md:flex items-center gap-6">
          <div className="text-center">
            <p className="text-sm font-medium text-green-400">
              {entry.problemsSolved}
            </p>
            <p className="text-xs text-slate-500">Solved</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-cyan-400">
              {entry.acceptanceRate}%
            </p>
            <p className="text-xs text-slate-500">Rate</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-purple-500">
              {entry.achievementsCount}
            </p>
            <p className="text-xs text-slate-500">Badges</p>
          </div>
        </div>

        {/* Level & XP */}
        <div className="text-right">
          <p className="text-lg font-bold text-cyan-400">Lv.{entry.level}</p>
          <p className="text-sm text-slate-400">
            {entry.xp.toLocaleString()} XP
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

function LeaderboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const timeframe = searchParams.get("timeframe") || "all-time";
  const page = parseInt(searchParams.get("page") || "1");

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/leaderboard?timeframe=${timeframe}&page=${page}&limit=25`,
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
        setIsInitialLoading(false);
      }
    }

    fetchLeaderboard();
  }, [timeframe, page]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      params.set(key, value);
    });
    router.push(`/leaderboard?${params.toString()}`);
  };

  if (isInitialLoading) {
    return (
      <PageLoader 
        message="Loading leaderboard..." 
        subtitle="Fetching top developers from the community"
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-amber-500" />
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          </div>
          <p className="text-slate-400">
            Top developers ranked by XP and achievements
          </p>
        </motion.div>

        {/* Timeframe Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center gap-2 mb-8">
          {timeframes.map(tf => (
            <button
              key={tf.value}
              onClick={() => updateParams({ timeframe: tf.value, page: "1" })}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeframe === tf.value
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
              }`}>
              {tf.label}
            </button>
          ))}
        </motion.div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="md" />
          </div>
        ) : data && data.leaderboard.length > 0 ? (
          <>
            {/* Leaderboard List */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-800">
                {data.leaderboard.map((entry, index) => (
                  <LeaderboardRow
                    key={entry.userId}
                    entry={entry}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>

            {/* Pagination */}
            {data.pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() =>
                    updateParams({ page: String(Math.max(1, page - 1)) })
                  }
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-slate-400">
                  Page {page} of {data.pagination.totalPages}
                </span>

                <button
                  onClick={() =>
                    updateParams({
                      page: String(
                        Math.min(data.pagination.totalPages, page + 1),
                      ),
                    })
                  }
                  disabled={page === data.pagination.totalPages}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20">
            <Trophy className="w-16 h-16 text-slate-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Rankings Yet
            </h2>
            <p className="text-slate-400 mb-4">
              Be the first to climb the leaderboard!
            </p>
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors">
              <Target className="w-4 h-4" />
              Start Solving
            </Link>
          </motion.div>
        )}

        {/* Stats Summary */}
        {data && data.pagination.totalCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mt-6 text-sm text-slate-500">
            Showing {(page - 1) * 25 + 1}-
            {Math.min(page * 25, data.pagination.totalCount)} of{" "}
            {data.pagination.totalCount} developers
          </motion.div>
        )}
      </div>
    </div>
  );
}

function LeaderboardLoading() {
  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="h-10 w-48 bg-slate-800 rounded animate-pulse mx-auto mb-4" />
          <div className="h-4 w-64 bg-slate-800 rounded animate-pulse mx-auto" />
        </div>
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-slate-900/50 rounded-xl animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<LeaderboardLoading />}>
      <LeaderboardContent />
    </Suspense>
  );
}
