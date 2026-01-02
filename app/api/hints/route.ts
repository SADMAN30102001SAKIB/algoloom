import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateHint } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { problemId, hintLevel, userCode } = body;

    if (!problemId || typeof hintLevel !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: problemId, hintLevel" },
        { status: 400 },
      );
    }

    if (hintLevel < 1 || hintLevel > 3) {
      return NextResponse.json(
        { error: "Hint level must be between 1 and 3" },
        { status: 400 },
      );
    }

    // Fetch problem details
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      include: {
        testCases: {
          take: 2, // Only send 2 example test cases
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Get user's Pro status first (needed for hint limit checks)
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isPro: true, role: true },
    });
    const isPro = fullUser?.isPro || fullUser?.role === "ADMIN";

    // Check existing hints for this problem
    const existingHints = await prisma.hintLog.findMany({
      where: {
        userId: user.id,
        problemId,
      },
      select: { hintLevel: true },
      orderBy: { hintLevel: "asc" },
    });

    const usedLevels = new Set(existingHints.map(h => h.hintLevel));

    // Pro users can regenerate hints (unlimited per problem)
    // Free users: enforce 3 hints max (one per level), sequential progression
    if (!isPro) {
      // Check if this level was already used
      if (usedLevels.has(hintLevel)) {
        return NextResponse.json(
          {
            error: `You've already used a Level ${hintLevel} hint for this problem. Upgrade to Pro for unlimited hints!`,
          },
          { status: 400 },
        );
      }

      // Enforce sequential progression: can't skip levels
      if (hintLevel > 1 && !usedLevels.has(hintLevel - 1)) {
        return NextResponse.json(
          {
            error: `You must use Level ${hintLevel - 1} hint first before requesting Level ${hintLevel}.`,
          },
          { status: 400 },
        );
      }
    }

    // Check daily hint limit (5 hints per day for free users, unlimited for Pro)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hintsToday = await prisma.hintLog.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: today,
        },
      },
    });

    const DAILY_LIMIT = 5; // Free users get 5 hints per day total
    if (!isPro && hintsToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error:
            "Daily hint limit reached. Upgrade to Pro for unlimited hints!",
        },
        { status: 429 },
      );
    }

    // Get user's submission history for this problem to determine level and attempts
    const userSubmissions = await prisma.submission.findMany({
      where: {
        userId: user.id,
        problemId: problem.id,
      },
      select: {
        language: true,
        verdict: true,
      },
    });

    const attempts = userSubmissions.length;
    const languagesUsed = Array.from(
      new Set(userSubmissions.map(s => s.language)),
    );
    const userLevel =
      userSubmissions.filter(s => s.verdict === "ACCEPTED").length > 0 ? 2 : 1; // Simple level calculation

    // Generate hint using Gemini AI
    const hintText = await generateHint({
      problemTitle: problem.title,
      problemDescription: problem.description,
      difficulty: problem.difficulty,
      userLevel,
      attempts,
      languagesUsed,
      hintLevel,
      userCode: userCode || undefined,
      testCases: problem.testCases.map(tc => ({
        input: tc.input,
        output: tc.output,
      })),
    });

    // Save hint to database
    const hint = await prisma.hintLog.create({
      data: {
        userId: user.id,
        problemId: problem.id,
        hintLevel,
        prompt: JSON.stringify({ hintLevel }),
        response: hintText,
      },
    });

    // Mark hintsUsed in ProblemStat (if not already solved)
    const existingStat = await prisma.problemStat.findUnique({
      where: {
        userId_problemId: {
          userId: user.id,
          problemId: problem.id,
        },
      },
    });

    if (!existingStat || existingStat.status !== "SOLVED") {
      await prisma.problemStat.upsert({
        where: {
          userId_problemId: {
            userId: user.id,
            problemId: problem.id,
          },
        },
        update: {
          hintsUsed: true,
        },
        create: {
          userId: user.id,
          problemId: problem.id,
          status: "ATTEMPTED",
          hintsUsed: true,
        },
      });
    }

    // Deduct XP cost and recalculate level
    const xpCost = hintLevel * 5; // 5 XP per hint level
    const newXP = Math.max(0, user.xp - xpCost);
    const newLevel = Math.floor(Math.sqrt(newXP / 5)) + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    return NextResponse.json({
      success: true,
      hint: {
        id: hint.id,
        hintText: hintText,
        hintLevel: hintLevel,
        xpSpent: xpCost,
        createdAt: hint.createdAt.toISOString(),
      },
      remainingHints: isPro ? -1 : DAILY_LIMIT - hintsToday - 1, // -1 means unlimited
      isPro,
    });
  } catch (error) {
    console.error("Hint generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate hint. Please try again." },
      { status: 500 },
    );
  }
}

// Get hint history for a problem
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId");

    if (!problemId) {
      return NextResponse.json(
        { error: "Missing problemId parameter" },
        { status: 400 },
      );
    }

    const hints = await prisma.hintLog.findMany({
      where: {
        userId: user.id,
        problemId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return NextResponse.json({
      success: true,
      hints: hints.map(h => ({
        id: h.id,
        hintText: h.response,
        hintLevel: h.hintLevel,
        xpSpent: h.hintLevel * 5,
        createdAt: h.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Hint fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hints" },
      { status: 500 },
    );
  }
}
