"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Clock, CheckCircle, ChevronRight, Target } from "lucide-react";

interface DailyChallenge {
  id: string;
  date: string;
  xpBonus: number;
  problem: {
    id: string;
    title: string;
    slug: string;
    difficulty: string;
    tags: string[];
  };
  completed: boolean;
  completedAt: string | null;
  earnedBonus: boolean;
  timeUntilReset: number;
}

const difficultyColors: Record<string, string> = {
  EASY: "text-emerald-500",
  MEDIUM: "text-amber-500",
  HARD: "text-red-500",
};

const difficultyBg: Record<string, string> = {
  EASY: "bg-emerald-500/10 border-emerald-500/20",
  MEDIUM: "bg-amber-500/10 border-amber-500/20",
  HARD: "bg-red-500/10 border-red-500/20",
};

export default function DailyChallengeBanner() {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const res = await fetch("/api/daily-challenge");
        const data = await res.json();

        if (data.success) {
          setChallenge(data.challenge);
        }
      } catch (error) {
        console.error("Failed to fetch daily challenge:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchChallenge();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!challenge?.timeUntilReset) return;

    function updateTimer() {
      const now = Date.now();
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now;

      if (diff <= 0) {
        setTimeLeft("Resetting...");
        // Refetch after reset
        setTimeout(() => window.location.reload(), 1000);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    }

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  if (loading) {
    return (
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 animate-pulse">
        <div className="h-20" />
      </div>
    );
  }

  if (!challenge) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-xl border ${
          challenge.completed
            ? "bg-emerald-500/5 border-emerald-500/20"
            : difficultyBg[challenge.problem.difficulty]
        }`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left side - Challenge info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 rounded-full">
                  <Target className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-amber-500">
                    DAILY CHALLENGE
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs text-zinc-500">
                  <Clock className="w-3 h-3" />
                  <span>Resets in {timeLeft}</span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                {challenge.problem.title}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-medium ${difficultyColors[challenge.problem.difficulty]}`}>
                  {challenge.problem.difficulty}
                </span>
                <span className="text-zinc-600">•</span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    +{challenge.xpBonus} Bonus XP
                  </span>
                </div>
                {challenge.problem.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right side - Action */}
            <div className="flex-shrink-0">
              {challenge.completed ? (
                challenge.earnedBonus ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-500 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Already Solved</span>
                  </div>
                )
              ) : (
                <Link
                  href={`/problems/${challenge.problem.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                  <span className="font-medium">Start Challenge</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
