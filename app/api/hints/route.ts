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

    // Check daily hint limit (3 hints per problem per day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const hintsToday = await prisma.hintLog.count({
      where: {
        userId: user.id,
        problemId: problem.id,
        createdAt: {
          gte: today,
        },
      },
    });

    if (hintsToday >= 3) {
      return NextResponse.json(
        { error: "Daily hint limit reached (3 hints per problem per day)" },
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
        cost: 0,
      },
    });

    // Deduct XP cost (optional: implement XP cost for hints)
    const xpCost = hintLevel * 5; // 5 XP per hint level
    await prisma.user.update({
      where: { id: user.id },
      data: {
        xp: {
          decrement: Math.min(xpCost, user.xp), // Don't go below 0 XP
        },
      },
    });

    return NextResponse.json({
      success: true,
      hint: {
        id: hint.id,
        content: hintText,
        level: hintLevel,
        xpCost,
      },
      remainingHints: 3 - hintsToday - 1,
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
        content: h.response,
        level: h.hintLevel,
        createdAt: h.createdAt,
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
