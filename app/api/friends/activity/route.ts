import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends/activity
 * Get recent activity from friends
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get friend IDs (where status is ACCEPTED)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { userId: user.id, status: "ACCEPTED" },
          { friendId: user.id, status: "ACCEPTED" },
        ],
      },
      select: {
        userId: true,
        friendId: true,
      },
    });

    const friendIds = friendships.map(f =>
      f.userId === user.id ? f.friendId : f.userId,
    );

    if (friendIds.length === 0) {
      return NextResponse.json({
        success: true,
        activity: [],
      });
    }

    // Get recent activity: problems solved by friends in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentSolves, recentAchievements] = await Promise.all([
      // Recent problem solves
      prisma.problemStat.findMany({
        where: {
          userId: { in: friendIds },
          solved: true,
          solvedAt: { gte: sevenDaysAgo },
        },
        include: {
          user: {
            select: {
              username: true,
              name: true,
              image: true,
            },
          },
          problem: {
            select: {
              title: true,
              slug: true,
              difficulty: true,
            },
          },
        },
        orderBy: { solvedAt: "desc" },
        take: 30,
      }),
      // Recent achievements
      prisma.userAchievement.findMany({
        where: {
          userId: { in: friendIds },
          unlockedAt: { gte: sevenDaysAgo },
        },
        include: {
          user: {
            select: {
              username: true,
              name: true,
              image: true,
            },
          },
          achievement: {
            select: {
              name: true,
              icon: true,
            },
          },
        },
        orderBy: { unlockedAt: "desc" },
        take: 20,
      }),
    ]);

    // Combine and format activity
    const activity: Array<{
      id: string;
      type: "solved" | "achievement" | "streak" | "level" | "daily";
      user: {
        username: string;
        name: string | null;
        image: string | null;
      };
      data: {
        problemTitle?: string;
        problemSlug?: string;
        problemDifficulty?: string;
        achievementName?: string;
        achievementIcon?: string;
        streakDays?: number;
        level?: number;
      };
      createdAt: string;
    }> = [];

    // Add solves
    for (const solve of recentSolves) {
      activity.push({
        id: `solve-${solve.id}`,
        type: "solved",
        user: solve.user,
        data: {
          problemTitle: solve.problem.title,
          problemSlug: solve.problem.slug,
          problemDifficulty: solve.problem.difficulty,
        },
        createdAt: solve.solvedAt?.toISOString() || new Date().toISOString(),
      });
    }

    // Add achievements
    for (const ua of recentAchievements) {
      activity.push({
        id: `achievement-${ua.id}`,
        type: "achievement",
        user: ua.user,
        data: {
          achievementName: ua.achievement.name,
          achievementIcon: ua.achievement.icon,
        },
        createdAt: ua.unlockedAt.toISOString(),
      });
    }

    // Sort by date (newest first)
    activity.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    // Limit to 50 items
    const limitedActivity = activity.slice(0, 50);

    return NextResponse.json({
      success: true,
      activity: limitedActivity,
    });
  } catch (error) {
    console.error("Friend activity fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch friend activity" },
      { status: 500 },
    );
  }
}
