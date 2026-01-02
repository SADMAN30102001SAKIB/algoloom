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
    const submissions = await prisma.submission.findMany({
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
    });

    return NextResponse.json({
      success: true,
      submissions,
    });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch submissions" },
      { status: 500 },
    );
  }
}
