import prisma from "@/lib/prisma";

/**
 * Updates a user's leaderboard entry for all time periods
 * Called when user's XP changes (e.g., after solving a problem)
 *
 * NOTE: Ranks are calculated dynamically at query time in the API,
 * not stored here. This just updates the score.
 *
 * For ALL_TIME: Uses total XP
 * For WEEKLY/MONTHLY: Uses XP earned within that period (problem XP + achievement XP)
 */
export async function updateUserLeaderboard(userId: string, totalXp: number) {
  try {
    const now = new Date();

    // Calculate period start dates
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get XP earned/spent in each period from problems, achievements, and hints
    const [
      weeklyProblemXp,
      monthlyProblemXp,
      weeklyAchievementXp,
      monthlyAchievementXp,
      weeklyHintXp,
      monthlyHintXp,
    ] = await Promise.all([
      // Weekly problem XP: sum of xpEarned in last 7 days
      prisma.problemStat.aggregate({
        where: {
          userId,
          solved: true,
          solvedAt: { gte: weekStart },
        },
        _sum: { xpEarned: true },
      }),
      // Monthly problem XP: sum of xpEarned this month
      prisma.problemStat.aggregate({
        where: {
          userId,
          solved: true,
          solvedAt: { gte: monthStart },
        },
        _sum: { xpEarned: true },
      }),
      // Weekly achievement XP
      prisma.userAchievement.findMany({
        where: {
          userId,
          unlockedAt: { gte: weekStart },
        },
        include: {
          achievement: { select: { xpReward: true } },
        },
      }),
      // Monthly achievement XP
      prisma.userAchievement.findMany({
        where: {
          userId,
          unlockedAt: { gte: monthStart },
        },
        include: {
          achievement: { select: { xpReward: true } },
        },
      }),
      // Weekly hint XP spent (hintLevel * 5 per hint)
      prisma.hintLog.findMany({
        where: {
          userId,
          createdAt: { gte: weekStart },
        },
        select: { hintLevel: true },
      }),
      // Monthly hint XP spent
      prisma.hintLog.findMany({
        where: {
          userId,
          createdAt: { gte: monthStart },
        },
        select: { hintLevel: true },
      }),
    ]);

    // Calculate period XP: earned - spent
    const weeklyXp = Math.max(
      0,
      (weeklyProblemXp._sum.xpEarned || 0) +
        weeklyAchievementXp.reduce(
          (sum, ua) => sum + ua.achievement.xpReward,
          0,
        ) -
        weeklyHintXp.reduce((sum, h) => sum + h.hintLevel * 5, 0),
    );
    const monthlyXp = Math.max(
      0,
      (monthlyProblemXp._sum.xpEarned || 0) +
        monthlyAchievementXp.reduce(
          (sum, ua) => sum + ua.achievement.xpReward,
          0,
        ) -
        monthlyHintXp.reduce((sum, h) => sum + h.hintLevel * 5, 0),
    );

    // Update each period
    const periods = [
      { period: "ALL_TIME" as const, score: totalXp },
      { period: "WEEKLY" as const, score: weeklyXp },
      { period: "MONTHLY" as const, score: monthlyXp },
    ];

    for (const { period, score } of periods) {
      // Skip if user has 0 score for time-based periods
      if (period !== "ALL_TIME" && score === 0) {
        await prisma.leaderboard.deleteMany({
          where: { userId, period },
        });
        continue;
      }

      // Upsert leaderboard entry (rank calculated at query time)
      await prisma.leaderboard.upsert({
        where: {
          userId_period: { userId, period },
        },
        create: {
          userId,
          period,
          score,
        },
        update: {
          score,
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update leaderboard:", error);
    return { success: false, error };
  }
}
