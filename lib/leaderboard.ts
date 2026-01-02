import prisma from "@/lib/prisma";

/**
 * Updates a user's position in the leaderboard for all time periods
 * Called when user's XP changes (e.g., after solving a problem)
 */
export async function updateUserLeaderboard(userId: string, newXp: number) {
  try {
    // Calculate ranks for each period
    const periods = [
      { period: "ALL_TIME" as const, dateFilter: undefined },
      {
        period: "MONTHLY" as const,
        dateFilter: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          1,
        ),
      },
      {
        period: "WEEKLY" as const,
        dateFilter: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    for (const { period, dateFilter } of periods) {
      // Count users with higher XP to determine rank
      // For time-based periods, only count users active in that period
      const rank =
        (await prisma.user.count({
          where: {
            xp: { gt: newXp },
            ...(dateFilter
              ? {
                  submissions: {
                    some: {
                      createdAt: { gte: dateFilter },
                      verdict: "ACCEPTED",
                    },
                  },
                }
              : {}),
          },
        })) + 1;

      // Upsert leaderboard entry
      // Note: For compound unique constraints, we need to find-or-create manually
      const existing = await prisma.leaderboard.findFirst({
        where: {
          userId,
          period,
        },
      });

      if (existing) {
        await prisma.leaderboard.update({
          where: { id: existing.id },
          data: {
            rank,
            score: newXp,
          },
        });
      } else {
        await prisma.leaderboard.create({
          data: {
            userId,
            period,
            rank,
            score: newXp,
          },
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Failed to update leaderboard:", error);
    return { success: false, error };
  }
}
