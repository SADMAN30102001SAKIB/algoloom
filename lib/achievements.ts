import prisma from "@/lib/prisma";

interface AchievementContext {
  userId: string;
  problemId?: string;
  submissionTime?: Date;
  isFirstAttempt?: boolean;
}

interface UnlockedAchievement {
  id: string;
  name: string;
  slug: string;
  icon: string;
  xpReward: number;
}

/**
 * Checks and awards achievements after a successful problem solve
 * Returns list of newly unlocked achievements
 */
export async function checkAndAwardAchievements(
  ctx: AchievementContext,
): Promise<UnlockedAchievement[]> {
  const { userId, submissionTime, isFirstAttempt } = ctx;

  const unlockedAchievements: UnlockedAchievement[] = [];

  try {
    // Get all achievements user doesn't have yet
    const [allAchievements, userAchievements] = await Promise.all([
      prisma.achievement.findMany(),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
    ]);

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));
    const pendingAchievements = allAchievements.filter(
      a => !unlockedIds.has(a.id),
    );

    if (pendingAchievements.length === 0) {
      return []; // User has all achievements
    }

    // Get user stats for checking requirements
    const [
      solvedCount,
      easySolved,
      mediumSolved,
      hardSolved,
      languagesUsed,
      tagsExplored,
      user,
      solvedWithoutHints,
      currentStreak,
    ] = await Promise.all([
      // Total problems solved
      prisma.problemStat.count({
        where: { userId, solved: true },
      }),
      // Easy problems solved
      prisma.problemStat.count({
        where: {
          userId,
          solved: true,
          problem: { difficulty: "EASY" },
        },
      }),
      // Medium problems solved
      prisma.problemStat.count({
        where: {
          userId,
          solved: true,
          problem: { difficulty: "MEDIUM" },
        },
      }),
      // Hard problems solved
      prisma.problemStat.count({
        where: {
          userId,
          solved: true,
          problem: { difficulty: "HARD" },
        },
      }),
      // Unique languages used in accepted submissions
      prisma.submission.findMany({
        where: { userId, verdict: "ACCEPTED" },
        select: { language: true },
        distinct: ["language"],
      }),
      // Unique tags from solved problems
      prisma.problem.findMany({
        where: {
          problemStats: { some: { userId, solved: true } },
        },
        select: { tags: true },
      }),
      // User level
      prisma.user.findUnique({
        where: { id: userId },
        select: { level: true },
      }),
      // Problems solved without hints
      prisma.problemStat.count({
        where: {
          userId,
          solved: true,
          hintsUsed: false,
        },
      }),
      // Calculate current streak
      calculateStreak(userId),
    ]);

    const uniqueTags = new Set(tagsExplored.flatMap(p => p.tags));
    const hour = submissionTime
      ? submissionTime.getHours()
      : new Date().getHours();

    // Check each pending achievement
    for (const achievement of pendingAchievements) {
      const requirement = achievement.requirement;
      let shouldUnlock = false;

      // Milestone achievements - Problem count
      if (requirement === "solve_1" && solvedCount >= 1) shouldUnlock = true;
      else if (requirement === "solve_5" && solvedCount >= 5)
        shouldUnlock = true;
      else if (requirement === "solve_10" && solvedCount >= 10)
        shouldUnlock = true;
      else if (requirement === "solve_25" && solvedCount >= 25)
        shouldUnlock = true;
      else if (requirement === "solve_100" && solvedCount >= 100)
        shouldUnlock = true;
      // Mastery achievements - Difficulty-based
      else if (requirement === "easy_10" && easySolved >= 10)
        shouldUnlock = true;
      else if (requirement === "medium_10" && mediumSolved >= 10)
        shouldUnlock = true;
      else if (requirement === "hard_10" && hardSolved >= 10)
        shouldUnlock = true;
      else if (requirement === "first_attempt" && isFirstAttempt)
        shouldUnlock = true;
      // Streak achievements
      else if (requirement === "streak_3" && currentStreak >= 3)
        shouldUnlock = true;
      else if (requirement === "streak_7" && currentStreak >= 7)
        shouldUnlock = true;
      else if (requirement === "streak_30" && currentStreak >= 30)
        shouldUnlock = true;
      // Level achievements
      else if (requirement === "level_5" && (user?.level ?? 0) >= 5)
        shouldUnlock = true;
      else if (requirement === "level_10" && (user?.level ?? 0) >= 10)
        shouldUnlock = true;
      else if (requirement === "level_25" && (user?.level ?? 0) >= 25)
        shouldUnlock = true;
      // Exploration achievements
      else if (requirement === "languages_3" && languagesUsed.length >= 3)
        shouldUnlock = true;
      else if (requirement === "tags_5" && uniqueTags.size >= 5)
        shouldUnlock = true;
      // Special achievements - Time-based
      else if (requirement === "night_solve" && hour >= 0 && hour < 5)
        shouldUnlock = true;
      else if (requirement === "morning_solve" && hour >= 5 && hour < 7)
        shouldUnlock = true;
      // No hints achievement
      else if (requirement === "no_hints_10" && solvedWithoutHints >= 10)
        shouldUnlock = true;

      if (shouldUnlock) {
        // Award achievement
        try {
          await prisma.userAchievement.create({
            data: {
              userId,
              achievementId: achievement.id,
            },
          });

          // Award XP bonus for the achievement
          if (achievement.xpReward > 0) {
            await prisma.user.update({
              where: { id: userId },
              data: {
                xp: { increment: achievement.xpReward },
              },
            });
          }

          unlockedAchievements.push({
            id: achievement.id,
            name: achievement.name,
            slug: achievement.slug,
            icon: achievement.icon,
            xpReward: achievement.xpReward,
          });
        } catch (error) {
          // Likely duplicate - another concurrent request beat us
          console.error(
            `Failed to award achievement ${achievement.slug}:`,
            error,
          );
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error("Achievement check failed:", error);
    return [];
  }
}

/**
 * Calculates the user's current solving streak (consecutive days with at least one solve)
 */
export async function calculateStreak(userId: string): Promise<number> {
  // Get all unique solve dates (ordered by most recent first)
  const solves = await prisma.problemStat.findMany({
    where: {
      userId,
      solved: true,
      solvedAt: { not: null },
    },
    select: { solvedAt: true },
    orderBy: { solvedAt: "desc" },
  });

  if (solves.length === 0) return 0;

  // Get unique dates (using local date string for day comparison)
  const dateSet = new Set(
    solves
      .filter(s => s.solvedAt !== null)
      .map(s => s.solvedAt!.toISOString().split("T")[0]),
  );
  const uniqueDates = Array.from(dateSet).sort().reverse();

  if (uniqueDates.length === 0) return 0;

  // Check if most recent solve is today or yesterday (streak still active)
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
    return 0; // Streak broken
  }

  // Count consecutive days
  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const currentDate = new Date(uniqueDates[i - 1]);
    const prevDate = new Date(uniqueDates[i]);
    const diffDays = Math.floor(
      (currentDate.getTime() - prevDate.getTime()) / 86400000,
    );

    if (diffDays === 1) {
      streak++;
    } else {
      break; // Gap in streak
    }
  }

  return streak;
}
