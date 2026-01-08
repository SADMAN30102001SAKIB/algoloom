import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  try {
    const { username } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const verdict = searchParams.get("verdict");
    const language = searchParams.get("language");

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, name: true, image: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = { userId: user.id };

    if (verdict && verdict !== "ALL") {
      where.verdict = verdict;
    }
    if (language && language !== "ALL") {
      where.language = language;
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
      user: {
        username: user.username,
        name: user.name,
        image: user.image,
      },
      submissions: submissionsWithHints,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching user submissions:", error);
    return NextResponse.json(
      { error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
