import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const user = await requireAuth();
    const { slug } = await params;

    // Get problem
    const problem = await prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      return NextResponse.json(
        { success: false, error: "Problem not found" },
        { status: 404 },
      );
    }

    // Fetch user's submissions for this problem
    const [submissions, problemStat] = await Promise.all([
      prisma.submission.findMany({
        where: {
          userId: user.id,
          problemId: problem.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          verdict: true,
          runtime: true,
          memory: true,
          language: true,
          createdAt: true,
        },
      }),
      prisma.problemStat.findUnique({
        where: {
          userId_problemId: {
            userId: user.id,
            problemId: problem.id,
          },
        },
        select: {
          hintsUsed: true,
        },
      }),
    ]);

    const hintsUsed = problemStat?.hintsUsed || false;

    return NextResponse.json({
      success: true,
      submissions: submissions.map(s => ({ ...s, hintsUsed })),
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
