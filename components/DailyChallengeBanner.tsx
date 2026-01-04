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
  EASY: "text-green-400",
  MEDIUM: "text-yellow-400",
  HARD: "text-red-400",
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
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 animate-pulse">
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
            ? "bg-green-500/5 border-green-500/20"
            : "bg-slate-900/50 border-slate-700"
        }`}>
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-28">
          <div className="absolute -right-16 -top-16 w-56 h-56 bg-gradient-to-br from-purple-500/12 via-cyan-500/8 to-transparent rounded-full blur-xl" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-gradient-to-tr from-cyan-500/10 to-transparent rounded-full blur-lg" />
        </div>

        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Left side - Challenge info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                  <Target className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-xs font-semibold text-cyan-400 tracking-wide">
                    DAILY CHALLENGE
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Resets in {timeLeft}</span>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                {challenge.problem.title}
              </h3>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-sm font-semibold ${difficultyColors[challenge.problem.difficulty]}`}>
                  {challenge.problem.difficulty}
                </span>
                <span className="text-slate-600">•</span>
                <div className="flex items-center gap-1 text-purple-400">
                  <Zap className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    +{challenge.xpBonus} Bonus XP
                  </span>
                </div>
                {challenge.problem.tags.slice(0, 3).map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs bg-slate-800/80 text-slate-300 rounded border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Right side - Action */}
            <div className="flex-shrink-0">
              {challenge.completed ? (
                challenge.earnedBonus ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-500 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">Completed!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-400 rounded-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium text-sm">Already Solved</span>
                  </div>
                )
              ) : (
                <Link
                  href={`/problems/${challenge.problem.slug}`}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors">
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
