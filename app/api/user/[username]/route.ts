import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateStreak } from "@/lib/achievements";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        name: true,
        username: true,
        email: false, // Don't expose email
        image: true,
        bio: true,
        location: true,
        website: true,
        githubUrl: true,
        linkedinUrl: true,
        xp: true,
        createdAt: true,
        isPro: true,
        emailVerified: true,
        subscription: {
          select: {
            plan: true,
            status: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
          orderBy: {
            unlockedAt: "desc",
          },
        },
        _count: {
          select: {
            submissions: true,
            problemStats: {
              where: {
                solved: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate level
    const level = Math.floor(Math.sqrt(user.xp / 5)) + 1;
    const xpForCurrentLevel = Math.pow(level - 1, 2) * 5;
    const xpForNextLevel = Math.pow(level, 2) * 5;
    const xpProgress = user.xp - xpForCurrentLevel;
    const xpRequired = xpForNextLevel - xpForCurrentLevel;

    // Get submission statistics
    const submissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
      },
      select: {
        verdict: true,
        language: true,
        createdAt: true,
      },
    });

    const verdictStats = {
      ACCEPTED: 0,
      REJECTED: 0,
      PENDING: 0,
    };

    const languageStats: Record<string, number> = {};

    submissions.forEach(sub => {
      if (sub.verdict in verdictStats) {
        verdictStats[sub.verdict as keyof typeof verdictStats]++;
      }
      languageStats[sub.language] = (languageStats[sub.language] || 0) + 1;
    });

    // Get difficulty breakdown
    const problemStats = await prisma.problemStat.findMany({
      where: {
        userId: user.id,
        status: "SOLVED",
      },
      include: {
        problem: {
          select: {
            difficulty: true,
          },
        },
      },
    });

    const difficultyStats = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0,
    };

    problemStats.forEach(stat => {
      const difficulty = stat.problem.difficulty;
      if (difficulty in difficultyStats) {
        difficultyStats[difficulty]++;
      }
    });

    // Get recent activity (last 365 days for heatmap)
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 365);

    const recentSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: yearAgo,
        },
      },
      select: {
        createdAt: true,
        verdict: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Create activity heatmap data
    const activityMap: Record<string, number> = {};
    recentSubmissions.forEach(sub => {
      const dateKey = sub.createdAt.toISOString().split("T")[0];
      activityMap[dateKey] = (activityMap[dateKey] || 0) + 1;
    });

    // Get recent solved problems
    const recentSolved = await prisma.problemStat.findMany({
      where: {
        userId: user.id,
        status: "SOLVED",
      },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
          },
        },
      },
      orderBy: {
        solvedAt: "desc",
      },
      take: 10,
    });

    // Calculate rank
    const userSolvedCount = await prisma.problemStat.count({
      where: {
        userId: user.id,
        solved: true,
      },
    });

    // Count users who rank higher than this user
    // First, count users with higher XP
    const higherXpCount = await prisma.user.count({
      where: {
        xp: {
          gt: user.xp,
        },
      },
    });

    // Then count users with same XP but more solved problems
    const sameXpUsers = await prisma.user.findMany({
      where: {
        xp: user.xp,
        id: {
          not: user.id, // Exclude current user
        },
      },
      select: {
        id: true,
        _count: {
          select: {
            problemStats: {
              where: { solved: true },
            },
          },
        },
      },
    });

    const sameXpHigherProblems = sameXpUsers.filter(
      u => u._count.problemStats > userSolvedCount,
    ).length;

    const rank = higherXpCount + sameXpHigherProblems + 1;

    // Calculate streak
    const streak = await calculateStreak(user.id);

    // Get friends count (accepted friendships where user is either userId or friendId)
    const friendsCount = await prisma.friendship.count({
      where: {
        OR: [
          { userId: user.id, status: "ACCEPTED" },
          { friendId: user.id, status: "ACCEPTED" },
        ],
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        image: user.image,
        bio: user.bio,
        location: user.location,
        website: user.website,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        xp: user.xp,
        level,
        isPro: user.isPro,
        emailVerified: !!user.emailVerified,
        subscriptionPlan:
          user.subscription?.status === "ACTIVE"
            ? user.subscription.plan
            : null,
        levelProgress: {
          current: xpProgress,
          required: xpRequired,
          percentage: Math.round((xpProgress / xpRequired) * 100),
        },
        rank,
        streak,
        friendsCount,
        problemsSolved: user._count.problemStats,
        totalSubmissions: user._count.submissions,
        acceptanceRate:
          user._count.submissions > 0
            ? Math.round(
                (user._count.problemStats / user._count.submissions) * 100,
              )
            : 0,
        memberSince: user.createdAt,
        achievements: user.achievements.map(ua => ({
          id: ua.achievement.id,
          name: ua.achievement.name,
          description: ua.achievement.description,
          icon: ua.achievement.icon,
          category: ua.achievement.category,
          unlockedAt: ua.unlockedAt,
        })),
        statistics: {
          verdicts: verdictStats,
          languages: languageStats,
          difficulties: difficultyStats,
        },
        activityHeatmap: activityMap,
        recentSolved: recentSolved.map(rs => ({
          problemId: rs.problem.id,
          title: rs.problem.title,
          slug: rs.problem.slug,
          difficulty: rs.problem.difficulty,
          solvedAt: rs.solvedAt,
        })),
      },
    });
  } catch (error) {
    console.error("User profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 },
    );
  }
}
