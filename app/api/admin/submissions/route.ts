import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const verdict = searchParams.get("verdict");
    const language = searchParams.get("language");
    const username = searchParams.get("username");
    const problemSlug = searchParams.get("problem");

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (verdict && verdict !== "ALL") {
      where.verdict = verdict;
    }
    if (language && language !== "ALL") {
      where.language = language;
    }
    if (username) {
      where.user = { username: { contains: username, mode: "insensitive" } };
    }
    if (problemSlug) {
      where.problem = { slug: { contains: problemSlug, mode: "insensitive" } };
    }

    const hintsFilter = searchParams.get("hints"); // 'USED', 'NOT_USED', or null

    // Handle hints filtering for admin (more complex because multiple users)
    if (hintsFilter === "USED" || hintsFilter === "NOT_USED") {
      const hintStats = await prisma.problemStat.findMany({
        where: { hintsUsed: true },
        select: { problemId: true, userId: true },
      });

      // Build an array of { userId, problemId } objects for filtering
      if (hintsFilter === "USED") {
        where.OR = hintStats.map(s => ({
          userId: s.userId,
          problemId: s.problemId,
        }));
        // If no one used hints, we need to ensure nothing is returned
        if (hintStats.length === 0) {
          where.id = "none";
        }
      } else {
        where.NOT = hintStats.map(s => ({
          userId: s.userId,
          problemId: s.problemId,
        }));
      }
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        select: {
          id: true,
          code: true,
          verdict: true,
          runtime: true,
          memory: true,
          language: true,
          testCasesPassed: true,
          totalTestCases: true,
          submittedAt: true,
          userId: true,
          problemId: true,
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              image: true,
            },
          },
          problem: {
            select: {
              id: true,
              title: true,
              slug: true,
              difficulty: true,
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.submission.count({ where }),
    ]);

    // Fetch problem stats for the results to determine hintsUsed
    // Only fetch for relevant users/problems in this page
    const userProblemPairs = submissions.map(s => ({
      userId: s.userId,
      problemId: s.problemId,
    }));

    const problemStats = await prisma.problemStat.findMany({
      where: {
        OR: userProblemPairs,
      },
      select: {
        userId: true,
        problemId: true,
        hintsUsed: true,
      },
    });

    // Map hintsUsed to submissions
    const statsMap = new Map(
      problemStats.map(s => [`${s.userId}-${s.problemId}`, s.hintsUsed]),
    );
    const submissionsWithHints = submissions.map(s => ({
      ...s,
      hintsUsed: statsMap.get(`${s.userId}-${s.problemId}`) || false,
    }));

    return NextResponse.json({
      submissions: submissionsWithHints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching admin submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
