"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PageLoader } from "@/components/ui/PageLoader";
import {
  Trophy,
  Target,
  Calendar,
  MapPin,
  Link as LinkIcon,
  CheckCircle,
  Code,
  Award,
  TrendingUp,
  ExternalLink,
  FileText,
  Flame,
  BadgeCheck,
  Users,
} from "lucide-react";
import FriendButton from "@/components/FriendButton";
import { PremiumBadge } from "@/components/premium/PremiumBadge";

// Brand icons (lucide deprecated them)
const GithubIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
  </svg>
);

interface UserProfile {
  id: string;
  name: string | null;
  username: string;
  image: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  xp: number;
  level: number;
  isPro: boolean;
  emailVerified: boolean;
  subscriptionPlan: "MONTHLY" | "YEARLY" | null;
  levelProgress: {
    current: number;
    required: number;
    percentage: number;
  };
  rank: number;
  streak: number;
  friendsCount: number;
  problemsSolved: number;
  totalSubmissions: number;
  acceptanceRate: number;
  memberSince: string;
  achievements: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    unlockedAt: string;
  }[];
  statistics: {
    verdicts: Record<string, number>;
    languages: Record<string, number>;
    difficulties: Record<string, number>;
  };
  activityHeatmap: Record<string, number>;
  recentSolved: {
    problemId: string;
    title: string;
    slug: string;
    difficulty: string;
    solvedAt: string;
  }[];
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-white">{value}</p>
          <p className="text-sm text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function ActivityHeatmap({ data }: { data: Record<string, number> }) {
  const today = new Date();
  const days = [];

  // Generate last 365 days
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days.push({
      date: dateStr,
      count: data[dateStr] || 0,
      dayOfWeek: date.getDay(),
    });
  }

  // Group by weeks
  const weeks: (typeof days)[] = [];
  let currentWeek: typeof days = [];

  days.forEach((day, index) => {
    if (index === 0) {
      // Pad the first week
      for (let i = 0; i < day.dayOfWeek; i++) {
        currentWeek.push({ date: "", count: 0, dayOfWeek: i });
      }
    }
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  const getColor = (count: number) => {
    if (count === 0) return "bg-slate-800";
    if (count === 1) return "bg-green-900";
    if (count <= 3) return "bg-green-700";
    if (count <= 5) return "bg-green-500";
    return "bg-green-400";
  };

  const totalSubmissions = Object.values(data).reduce((a, b) => a + b, 0);
  const activeDays = Object.keys(data).length;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          Activity
        </h3>
        <div className="text-sm text-slate-400">
          {totalSubmissions} submissions in {activeDays} days
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-fit">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`w-3 h-3 rounded-sm ${day.date ? getColor(day.count) : "bg-transparent"}`}
                  title={
                    day.date ? `${day.date}: ${day.count} submissions` : ""
                  }
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 mt-3 text-xs text-slate-500">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800" />
          <div className="w-3 h-3 rounded-sm bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-green-400" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function DifficultyBar({ stats }: { stats: Record<string, number> }) {
  const total = stats.EASY + stats.MEDIUM + stats.HARD;
  if (total === 0) return null;

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4">Problems Solved</h3>

      <div className="space-y-3">
        {[
          {
            key: "EASY",
            label: "Easy",
            color: "bg-green-400",
            textColor: "text-green-400",
          },
          {
            key: "MEDIUM",
            label: "Medium",
            color: "bg-yellow-400",
            textColor: "text-yellow-400",
          },
          {
            key: "HARD",
            label: "Hard",
            color: "bg-red-400",
            textColor: "text-red-400",
          },
        ].map(({ key, label, color, textColor }) => (
          <div key={key}>
            <div className="flex justify-between text-sm mb-1">
              <span className={textColor}>{label}</span>
              <span className="text-slate-400">{stats[key]}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} transition-all duration-500`}
                style={{ width: `${(stats[key] / Math.max(total, 1)) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LanguageStats({ stats }: { stats: Record<string, number> }) {
  const total = Object.values(stats).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const colors: Record<string, string> = {
    PYTHON: "bg-blue-500",
    JAVASCRIPT: "bg-yellow-500",
    CPP: "bg-purple-500",
    JAVA: "bg-orange-500",
    GO: "bg-cyan-500",
    RUST: "bg-red-500",
  };

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Code className="w-5 h-5 text-cyan-400" />
        Languages
      </h3>

      <div className="space-y-2">
        {sorted.map(([lang, count]) => (
          <div key={lang} className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${colors[lang] || "bg-slate-500"}`}
            />
            <span className="text-sm text-slate-300 flex-1">{lang}</span>
            <span className="text-sm text-slate-500">{count}</span>
            <span className="text-xs text-slate-600">
              ({Math.round((count / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AchievementCard({
  achievement,
}: {
  achievement: UserProfile["achievements"][0];
}) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3 flex items-center gap-3">
      <span className="text-2xl">{achievement.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">{achievement.name}</p>
        <p className="text-xs text-slate-400 truncate">
          {achievement.description}
        </p>
      </div>
    </div>
  );
}

function RecentSolvedList({
  problems,
}: {
  problems: UserProfile["recentSolved"];
}) {
  const difficultyColors = {
    EASY: "text-green-400",
    MEDIUM: "text-yellow-400",
    HARD: "text-red-400",
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-green-400" />
        Recently Solved
      </h3>

      {problems.length === 0 ? (
        <p className="text-slate-500 text-sm">No problems solved yet</p>
      ) : (
        <div className="space-y-2">
          {problems.map(problem => (
            <Link
              key={problem.problemId}
              href={`/problems/${problem.slug}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
              <span className="text-slate-300 hover:text-white truncate flex-1">
                {problem.title}
              </span>
              <span
                className={`text-xs font-medium ${difficultyColors[problem.difficulty as keyof typeof difficultyColors]}`}>
                {problem.difficulty}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const username = params.username as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/user/${username}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch profile");
        }

        setProfile(data.user);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <PageLoader message="Loading profile..." subtitle="Fetching user data" />
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
          <p className="text-slate-400 mb-4">
            {error || "This user doesn't exist"}
          </p>
          <Link href="/problems" className="text-cyan-400 hover:text-cyan-300">
            ← Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.username}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-slate-700"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700">
                  <span className="text-4xl font-bold text-slate-500">
                    {profile.username[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-white max-w-[200px] md:max-w-[300px] truncate">
                      {profile.name || profile.username}
                    </h1>
                    {profile.emailVerified && (
                      <span
                        className="flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 rounded-full"
                        title="Verified Account">
                        <BadgeCheck className="w-4 h-4 text-blue-400" />
                        <span className="text-xs text-blue-400 font-medium">
                          Verified
                        </span>
                      </span>
                    )}
                    {profile.isPro && (
                      <PremiumBadge
                        size="md"
                        plan={profile.subscriptionPlan || undefined}
                      />
                    )}
                    <FriendButton
                      targetUserId={profile.id}
                      targetUsername={profile.username}
                    />
                  </div>
                  <p className="text-slate-400 truncate max-w-[250px] md:max-w-[350px]">
                    @{profile.username}
                  </p>
                  {profile.bio && (
                    <p className="text-slate-300 mt-2 max-w-lg">
                      {profile.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    {profile.location && (
                      <span className="flex items-center gap-1 text-sm text-slate-400">
                        <MapPin className="w-4 h-4" />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400">
                        <LinkIcon className="w-4 h-4" />
                        Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-white">
                        <GithubIcon />
                        GitHub
                      </a>
                    )}
                    {profile.linkedinUrl && (
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-slate-400 hover:text-blue-500">
                        <LinkedinIcon />
                        LinkedIn
                      </a>
                    )}
                    <Link
                      href={`/profile/${profile.username}/submissions`}
                      className="flex items-center gap-1 text-sm text-slate-400 hover:text-cyan-400">
                      <FileText className="w-4 h-4" />
                      All Submissions
                    </Link>
                  </div>
                </div>

                {/* Level Badge */}
                <div className="bg-slate-800 rounded-lg p-4 text-center min-w-[140px]">
                  <div className="text-3xl font-bold text-cyan-400">
                    Lv. {profile.level}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">
                    {profile.xp.toLocaleString()} XP
                  </div>
                  <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-500 transition-all duration-500"
                      style={{ width: `${profile.levelProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {profile.levelProgress.current}/
                    {profile.levelProgress.required} XP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <StatCard
            icon={Trophy}
            label="Global Rank"
            value={`#${profile.rank}`}
            color="bg-amber-500/20 text-amber-500"
          />
          <StatCard
            icon={Target}
            label="Problems Solved"
            value={profile.problemsSolved}
            color="bg-green-400/20 text-green-400"
          />
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={profile.streak}
            color="bg-orange-500/20 text-orange-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Acceptance Rate"
            value={`${profile.acceptanceRate}%`}
            color="bg-blue-500/20 text-blue-500"
          />
          <StatCard
            icon={Award}
            label="Achievements"
            value={profile.achievements.length}
            color="bg-purple-500/20 text-purple-500"
          />
          <StatCard
            icon={Users}
            label="Friends"
            value={profile.friendsCount}
            color="bg-pink-500/20 text-pink-500"
          />
        </motion.div>

        {/* Activity Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6">
          <ActivityHeatmap data={profile.activityHeatmap} />
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6">
            <DifficultyBar stats={profile.statistics.difficulties} />
            <LanguageStats stats={profile.statistics.languages} />
          </motion.div>

          {/* Middle Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}>
            <RecentSolvedList problems={profile.recentSolved} />
          </motion.div>

          {/* Right Column - Achievements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Achievements ({profile.achievements.length})
            </h3>

            {profile.achievements.length === 0 ? (
              <p className="text-slate-500 text-sm">No achievements yet</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {profile.achievements.map(achievement => (
                  <AchievementCard
                    key={achievement.id}
                    achievement={achievement}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Member Since */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-8 text-sm text-slate-500">
          Member since{" "}
          {new Date(profile.memberSince).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </motion.div>
      </div>
    </div>
  );
}
