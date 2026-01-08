import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const verdict = searchParams.get("verdict");
    const language = searchParams.get("language");
    const problemId = searchParams.get("problemId");
    const hintsFilter = searchParams.get("hints"); // 'USED', 'NOT_USED', or null

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = { userId: user.id };

    if (verdict && verdict !== "ALL") {
      where.verdict = verdict;
    }
    if (language && language !== "ALL") {
      where.language = language;
    }
    if (problemId) {
      where.problemId = problemId;
    }

    // Handle hints filtering
    if (hintsFilter === "USED" || hintsFilter === "NOT_USED") {
      const hintStats = await prisma.problemStat.findMany({
        where: {
          userId: user.id,
          hintsUsed: true,
        },
        select: { problemId: true },
      });
      const problemIdsWithHints = hintStats.map(s => s.problemId);

      if (hintsFilter === "USED") {
        where.problemId = { in: problemIdsWithHints };
      } else {
        where.problemId = { notIn: problemIdsWithHints };
      }
    }

    const [submissions, total, problemStats] = await Promise.all([
      prisma.submission.findMany({
        where,
        select: {
          id: true,
          verdict: true,
          runtime: true,
          memory: true,
          language: true,
          testCasesPassed: true,
          totalTestCases: true,
          submittedAt: true,
          problemId: true,
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
      prisma.problemStat.findMany({
        where: {
          userId: user.id,
        },
        select: {
          problemId: true,
          hintsUsed: true,
        },
      }),
    ]);

    // Map hintsUsed to submissions
    const statsMap = new Map(problemStats.map(s => [s.problemId, s.hintsUsed]));
    const submissionsWithHints = submissions.map(s => ({
      ...s,
      hintsUsed: statsMap.get(s.problemId) || false,
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
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
