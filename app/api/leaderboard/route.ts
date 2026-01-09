import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateStreak } from "@/lib/achievements";

/**
 * Converts timeframe query param to Prisma LeaderboardPeriod enum
 */
function getLeaderboardPeriod(timeframe: string) {
  switch (timeframe) {
    case "weekly":
      return "WEEKLY";
    case "monthly":
      return "MONTHLY";
    case "all-time":
    default:
      return "ALL_TIME";
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const timeframe = searchParams.get("timeframe") || "all-time";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const period = getLeaderboardPeriod(timeframe);

    // Fetch leaderboard entries ordered by score (descending) for dynamic ranking
    const entries = await prisma.leaderboard.findMany({
      where: {
        period,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            xp: true,
            _count: {
              select: {
                submissions: true,
                problemStats: {
                  where: { solved: true },
                },
                achievements: true,
              },
            },
          },
        },
      },
      orderBy: {
        score: "desc", // Order by score to calculate ranks dynamically
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const startingRank = (page - 1) * limit + 1;

    // Fetch total accepted submission counts for all users on this page
    const acceptedCounts = await prisma.submission.groupBy({
      by: ["userId"],
      where: {
        userId: { in: entries.map(e => e.userId) },
        verdict: "ACCEPTED",
      },
      _count: {
        _all: true,
      },
    });

    const acceptedMap = new Map(
      acceptedCounts.map(c => [c.userId, c._count._all]),
    );

    // Calculate streaks for all users in parallel
    const streakPromises = entries.map(entry => calculateStreak(entry.user.id));
    const streaks = await Promise.all(streakPromises);

    // Variables for rank calculation
    let currentRank = startingRank;
    let lastScore = entries[0]?.score ?? 0;

    const leaderboard = entries.map((entry, index) => {
      // Handle ties - if score is different from last, update rank
      if (index > 0 && entry.score < lastScore) {
        currentRank = startingRank + index;
      }
      lastScore = entry.score;

      const level = Math.floor(Math.sqrt(entry.user.xp / 5)) + 1;
      const acceptedCount = acceptedMap.get(entry.userId) || 0;

      return {
        rank: currentRank,
        userId: entry.user.id,
        name: entry.user.name,
        username: entry.user.username,
        image: entry.user.image,
        // For time-based periods, show period score; for all-time show total XP
        xp: period === "ALL_TIME" ? entry.user.xp : entry.score,
        totalXp: entry.user.xp, // Always include total XP for reference
        level,
        problemsSolved: entry.user._count.problemStats,
        totalSubmissions: entry.user._count.submissions,
        acceptanceRate:
          entry.user._count.submissions > 0
            ? Math.round(
                (acceptedCount / entry.user._count.submissions) * 100,
              )
            : 0,
        currentStreak: streaks[index],
        achievementsCount: entry.user._count.achievements,
      };
    });

    // Get total count for pagination
    const totalCount = await prisma.leaderboard.count({
      where: { period },
    });

    return NextResponse.json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      timeframe,
    });
  } catch (error) {
    console.error("Leaderboard fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch leaderboard" },
      { status: 500 },
    );
  }
}

// Get specific user rank
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // Get user's leaderboard entry
    const entry = await prisma.leaderboard.findFirst({
      where: {
        userId,
        period: "ALL_TIME",
      },
      select: {
        score: true,
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate rank dynamically by counting users with higher scores
    const higherScoreCount = await prisma.leaderboard.count({
      where: {
        period: "ALL_TIME",
        score: { gt: entry.score },
      },
    });
    const rank = higherScoreCount + 1;

    // Get total users on leaderboard
    const totalUsers = await prisma.leaderboard.count({
      where: { period: "ALL_TIME" },
    });

    return NextResponse.json({
      success: true,
      rank,
      totalUsers,
      percentile: Math.round(((totalUsers - rank) / totalUsers) * 100),
    });
  } catch (error) {
    console.error("User rank fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user rank" },
      { status: 500 },
    );
  }
}
