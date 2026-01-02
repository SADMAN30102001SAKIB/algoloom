import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Code2,
  Zap,
  Trophy,
  Sparkles,
  TrendingUp,
  Target,
  Award,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-slate-900 to-cyan-900/20" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />

        <div className="relative container mx-auto px-4 py-24">
          <div className="text-center space-y-8 max-w-5xl mx-auto">
            {/* Logo/Title */}
            <div className="flex items-center justify-center gap-3 mb-8">
              <Code2 className="w-14 h-14 text-cyan-400" />
              <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                AlgoLoom
              </h1>
            </div>

            {/* Tagline */}
            <h2 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
              Master Algorithms
              <br />
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                with AI-Powered Intelligence
              </span>
            </h2>

            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Level up your coding skills with gamified problem-solving,
              intelligent AI hints from Google Gemini, and a comprehensive
              progression system. Track your XP, climb the leaderboard, and
              master algorithms.
            </p>

            {/* CTA Buttons */}
            <div className="flex gap-4 justify-center mt-12">
              <Link href="/problems">
                <Button
                  size="lg"
                  className="text-lg gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  Start Solving
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-lg border-slate-700 hover:bg-slate-800">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1: AI Hints */}
          <div className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-purple-500/50 hover:bg-slate-800/80 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Sparkles className="w-7 h-7 text-purple-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              AI-Powered Hints
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Get progressive, non-spoiler hints from Google Gemini AI when
              you&apos;re stuck. Three levels of hints to guide you without
              giving away the solution. Smart enough to understand your code and
              attempts.
            </p>
          </div>

          {/* Feature 2: Gamification */}
          <div className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500/20 to-cyan-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Zap className="w-7 h-7 text-cyan-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Level Up & Earn XP
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Earn XP for every problem solved. Track your progression with our
              quadratic leveling system:
              <span className="text-cyan-400 font-mono">
                {" "}
                Level = ⌊√(XP/5)⌋ + 1
              </span>
              . Unlock achievements, maintain streaks, and watch your skills
              grow.
            </p>
          </div>

          {/* Feature 3: Compete */}
          <div className="group bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-8 hover:border-yellow-500/50 hover:bg-slate-800/80 transition-all duration-300">
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Trophy className="w-7 h-7 text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Global Leaderboard
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Compete with developers worldwide. Track your rank, compare stats,
              and climb the leaderboard by solving problems and earning XP.
              Daily, weekly, and all-time rankings available.
            </p>
          </div>
        </div>
      </div>

      {/* XP System Breakdown */}
      <div className="container mx-auto px-4 py-24 bg-gradient-to-br from-slate-900/50 to-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-white mb-4">
              <TrendingUp className="inline w-10 h-10 text-cyan-400 mr-2" />
              XP & Leveling System
            </h3>
            <p className="text-slate-400 text-lg">
              Understand how our quadratic progression system rewards your
              growth
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Left: Formula Explanation */}
            <div className="space-y-6">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-8 h-full">
                <h4 className="text-2xl font-bold text-white mb-4">
                  Level Formula
                </h4>
                <div className="bg-slate-900/80 border border-slate-600 rounded-lg p-6 mb-6">
                  <code className="text-cyan-400 text-2xl font-mono">
                    Level = ⌊√(XP / 5)⌋ + 1
                  </code>
                </div>
                <p className="text-slate-400 mb-4">
                  Our quadratic leveling system means each level requires
                  progressively more XP, creating a meaningful sense of
                  achievement as you advance.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <span className="text-green-400 font-medium">
                      EASY Problems
                    </span>
                    <span className="text-white font-bold">+10 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <span className="text-yellow-400 font-medium">
                      MEDIUM Problems
                    </span>
                    <span className="text-white font-bold">+20 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <span className="text-red-400 font-medium">
                      HARD Problems
                    </span>
                    <span className="text-white font-bold">+30 XP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Level Examples */}
            <div className="space-y-4">
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-8 h-full">
                <h4 className="text-2xl font-bold text-white mb-6">
                  Level Milestones
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div>
                      <span className="text-white font-bold">Level 1</span>
                      <span className="text-slate-500 text-sm ml-2">
                        (Beginner)
                      </span>
                    </div>
                    <span className="text-slate-400">0-4 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div>
                      <span className="text-white font-bold">Level 5</span>
                      <span className="text-green-400 text-sm ml-2">
                        (Novice)
                      </span>
                    </div>
                    <span className="text-slate-400">80-124 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div>
                      <span className="text-white font-bold">Level 10</span>
                      <span className="text-cyan-400 text-sm ml-2">
                        (Intermediate)
                      </span>
                    </div>
                    <span className="text-slate-400">405-484 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                    <div>
                      <span className="text-white font-bold">Level 20</span>
                      <span className="text-purple-400 text-sm ml-2">
                        (Advanced)
                      </span>
                    </div>
                    <span className="text-slate-400">1805-1904 XP</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30">
                    <div>
                      <span className="text-white font-bold">Level 50+</span>
                      <span className="text-yellow-400 text-sm ml-2">
                        (Master)
                      </span>
                    </div>
                    <span className="text-slate-300">12,005+ XP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h3 className="text-4xl font-bold text-white mb-4">
            Powerful Features Built for Learners
          </h3>
          <p className="text-slate-400 text-lg">
            Everything you need to master algorithms and data structures
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Code2 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  4 Languages Supported
                </h4>
                <p className="text-slate-400 text-sm">
                  Python, C++, Java, JavaScript with Monaco editor
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Real-Time Testing
                </h4>
                <p className="text-slate-400 text-sm">
                  Judge0 integration for instant code execution and feedback
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Achievement System
                </h4>
                <p className="text-slate-400 text-sm">
                  Unlock badges for milestones and special accomplishments
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Smart Hint System
                </h4>
                <p className="text-slate-400 text-sm">
                  3 progressive hint levels that adapt to your attempts
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-blue-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Trophy className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Daily Challenges
                </h4>
                <p className="text-slate-400 text-sm">
                  Maintain streaks and compete on timeframe leaderboards
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-red-500/50 transition-all">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white mb-2">
                  Progress Tracking
                </h4>
                <p className="text-slate-400 text-sm">
                  Detailed stats, submission history, and performance metrics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="container mx-auto px-4 py-12">
        <h3 className="text-4xl font-bold text-white text-center mb-16">
          How AlgoLoom Works
        </h3>
        <div className="grid md:grid-cols-4 gap-8">
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-cyan-400 group-hover:scale-110 transition-transform">
              1
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">
              Choose a Problem
            </h4>
            <p className="text-slate-400">
              Browse 500+ problems by difficulty, tags, or company. Filter by
              your solved/attempted status.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-purple-400 group-hover:scale-110 transition-transform">
              2
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">
              Code Your Solution
            </h4>
            <p className="text-slate-400">
              Use our Monaco editor with syntax highlighting. Code in Python,
              C++, Java, or JavaScript.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-500/20 to-orange-500/20 border-2 border-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-pink-400 group-hover:scale-110 transition-transform">
              3
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">
              Get AI Hints
            </h4>
            <p className="text-slate-400">
              Stuck? Request progressive hints from Gemini AI. 3 levels: subtle
              nudge → approach → detailed guidance.
            </p>
          </div>
          <div className="text-center group">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 border-2 border-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl font-bold text-yellow-400 group-hover:scale-110 transition-transform">
              4
            </div>
            <h4 className="text-xl font-semibold text-white mb-3">
              Earn XP & Rank Up
            </h4>
            <p className="text-slate-400">
              Submit, get instant feedback from Judge0, and earn XP. Level up
              and climb the leaderboard!
            </p>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-24">
        <div className="bg-gradient-to-r from-cyan-900/40 to-purple-900/40 border border-slate-700 rounded-2xl p-16 text-center">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h3>
          <p className="text-slate-300 mb-10 text-lg max-w-2xl mx-auto">
            Join thousands of developers mastering algorithms on AlgoLoom. Track
            your progress, earn XP, and become a better coder.
          </p>
          <Link href="/problems">
            <Button
              size="lg"
              className="text-lg gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
              Explore Problems
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
            <div>© 2026 AlgoLoom. All rights reserved.</div>
            <div className="flex gap-6">
              <Link
                href="/about"
                className="hover:text-cyan-400 transition-colors">
                About
              </Link>
              <Link
                href="/privacy"
                className="hover:text-cyan-400 transition-colors">
                Privacy
              </Link>
              <Link
                href="/terms"
                className="hover:text-primary transition-colors">
                Terms
              </Link>
              <Link
                href="/contact"
                className="hover:text-primary transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
