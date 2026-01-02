import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/daily-challenges
 * List all scheduled daily challenges (past and future)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const upcoming = searchParams.get("upcoming") === "true";

    const skip = (page - 1) * limit;

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const where = upcoming ? { date: { gte: today } } : {};

    const [challenges, total] = await Promise.all([
      prisma.dailyChallenge.findMany({
        where,
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
        orderBy: { date: "desc" },
        skip,
        take: limit,
      }),
      prisma.dailyChallenge.count({ where }),
    ]);

    // Get all problems for dropdown selection
    const problems = await prisma.problem.findMany({
      where: { publishedAt: { not: null } },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
      },
      orderBy: { title: "asc" },
    });

    return NextResponse.json({
      success: true,
      challenges,
      problems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin daily challenges fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch daily challenges" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/admin/daily-challenges
 * Schedule a new daily challenge
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { date, problemId, xpBonus = 20 } = body;

    if (!date || !problemId) {
      return NextResponse.json(
        { error: "Date and problemId are required" },
        { status: 400 },
      );
    }

    // Parse and normalize date to midnight UTC
    const challengeDate = new Date(date);
    challengeDate.setUTCHours(0, 0, 0, 0);

    // Check if problem exists
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: { id: true, publishedAt: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    if (!problem.publishedAt) {
      return NextResponse.json(
        { error: "Cannot schedule unpublished problem" },
        { status: 400 },
      );
    }

    // Check if a challenge already exists for this date
    const existing = await prisma.dailyChallenge.findUnique({
      where: { date: challengeDate },
    });

    if (existing) {
      // Update existing challenge
      const updated = await prisma.dailyChallenge.update({
        where: { date: challengeDate },
        data: { problemId, xpBonus },
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
      });

      return NextResponse.json({
        success: true,
        challenge: updated,
        message: "Daily challenge updated",
      });
    }

    // Create new challenge
    const challenge = await prisma.dailyChallenge.create({
      data: {
        date: challengeDate,
        problemId,
        xpBonus,
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
    });

    return NextResponse.json({
      success: true,
      challenge,
      message: "Daily challenge scheduled",
    });
  } catch (error) {
    console.error("Admin daily challenge create error:", error);
    return NextResponse.json(
      { error: "Failed to schedule daily challenge" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/admin/daily-challenges
 * Delete a scheduled daily challenge (allows auto-generation to take over)
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const date = searchParams.get("date");

    if (!id && !date) {
      return NextResponse.json(
        { error: "Either id or date is required" },
        { status: 400 },
      );
    }

    if (id) {
      await prisma.dailyChallenge.delete({
        where: { id },
      });
    } else if (date) {
      const challengeDate = new Date(date);
      challengeDate.setUTCHours(0, 0, 0, 0);

      await prisma.dailyChallenge.delete({
        where: { date: challengeDate },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Daily challenge deleted. Auto-generation will take over.",
    });
  } catch (error) {
    console.error("Admin daily challenge delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete daily challenge" },
      { status: 500 },
    );
  }
}
