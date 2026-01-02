import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/daily-challenge
 * Returns today's daily challenge
 * Auto-generates one if admin hasn't scheduled it (lazy generation)
 */
export async function GET() {
  try {
    // Get today's date at midnight UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Check if today's challenge exists
    let challenge = await prisma.dailyChallenge.findUnique({
      where: { date: today },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            tags: true,
          },
        },
      },
    });

    // If no challenge scheduled, auto-generate one
    if (!challenge) {
      challenge = await generateDailyChallenge(today);
    }

    if (!challenge) {
      return NextResponse.json(
        { error: "No problems available for daily challenge" },
        { status: 404 },
      );
    }

    // Get current user to check if they've completed it
    const user = await getCurrentUser();
    let completed = false;
    let completedAt = null;
    let earnedBonus = false;

    if (user) {
      const problemStat = await prisma.problemStat.findFirst({
        where: {
          userId: user.id,
          problemId: challenge.problemId,
          solved: true,
        },
        select: { solvedAt: true },
      });

      if (problemStat) {
        completed = true;
        completedAt = problemStat.solvedAt;
        // Check if solved today (earned the bonus)
        if (problemStat.solvedAt && problemStat.solvedAt >= today) {
          earnedBonus = true;
        }
      }
    }

    // Calculate time until reset (midnight UTC)
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    const timeUntilReset = tomorrow.getTime() - Date.now();

    return NextResponse.json({
      success: true,
      challenge: {
        id: challenge.id,
        date: challenge.date,
        xpBonus: challenge.xpBonus,
        problem: challenge.problem,
        completed,
        completedAt,
        earnedBonus,
        timeUntilReset,
      },
    });
  } catch (error) {
    console.error("Daily challenge fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily challenge" },
      { status: 500 },
    );
  }
}

/**
 * Auto-generates a daily challenge for the given date
 * Priority: 1) Never used 2) Not used in 30 days 3) Oldest used
 */
async function generateDailyChallenge(date: Date) {
  // Priority 1: Problems never used as daily challenge
  let problem = await prisma.problem.findFirst({
    where: {
      publishedAt: { not: null },
      dailyChallenges: { none: {} },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });

  // Priority 2: Problems not used in last 30 days
  if (!problem) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);

    const recentChallenges = await prisma.dailyChallenge.findMany({
      where: { date: { gte: thirtyDaysAgo } },
      select: { problemId: true },
    });

    const recentProblemIds = recentChallenges.map(c => c.problemId);

    problem = await prisma.problem.findFirst({
      where: {
        publishedAt: { not: null },
        id: { notIn: recentProblemIds },
      },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
  }

  // Priority 3: Reuse oldest used problem
  if (!problem) {
    const oldestChallenge = await prisma.dailyChallenge.findFirst({
      orderBy: { date: "asc" },
      select: { problemId: true },
    });

    if (oldestChallenge) {
      problem = { id: oldestChallenge.problemId };
    }
  }

  // Still no problem? Get any published problem
  if (!problem) {
    problem = await prisma.problem.findFirst({
      where: { publishedAt: { not: null } },
      select: { id: true },
    });
  }

  if (!problem) {
    return null;
  }

  // Create the daily challenge
  const challenge = await prisma.dailyChallenge.create({
    data: {
      date,
      problemId: problem.id,
      xpBonus: 20,
    },
    include: {
      problem: {
        select: {
          id: true,
          title: true,
          slug: true,
          difficulty: true,
          tags: true,
        },
      },
    },
  });

  return challenge;
}
