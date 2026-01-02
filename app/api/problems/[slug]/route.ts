import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface UserSubmission {
  id: string;
  verdict: string;
  runtime: number | null;
  memory: number | null;
  language: string;
  createdAt: Date;
}

// GET /api/problems/[slug] - Get single problem details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const problem = await prisma.problem.findUnique({
      where: { slug },
      include: {
        testCases: {
          where: {
            isHidden: false, // Only show visible test cases
          },
        },
        _count: {
          select: {
            submissions: true,
            testCases: true, // Get total count of all test cases
          },
        },
      },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Check if problem is published (admins can see unpublished problems)
    const user = await getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    if (!problem.publishedAt && !isAdmin) {
      return NextResponse.json(
        { error: "This problem is not yet published." },
        { status: 404 },
      );
    }

    // Check premium access
    if (problem.isPremium) {
      if (!user) {
        return NextResponse.json(
          {
            error:
              "This is a premium problem. Please sign in with a Pro account.",
          },
          { status: 403 },
        );
      }

      if (!user.isPro) {
        return NextResponse.json(
          { error: "This is a premium problem. Upgrade to Pro to access it." },
          { status: 403 },
        );
      }
    }
    const acceptedCount = await prisma.submission.count({
      where: {
        problemId: problem.id,
        verdict: "ACCEPTED",
      },
    });

    const totalSubmissions = problem._count.submissions;
    const acceptanceRate =
      totalSubmissions > 0
        ? Math.round((acceptedCount / totalSubmissions) * 100)
        : 0;

    // Get user-specific data if logged in
    let userStatus = null;
    let userSubmissions: UserSubmission[] = [];

    if (user) {
      const problemStat = await prisma.problemStat.findUnique({
        where: {
          userId_problemId: {
            userId: user.id,
            problemId: problem.id,
          },
        },
      });

      userStatus = problemStat?.status || "UNTOUCHED";

      // Get user's recent submissions for this problem
      userSubmissions = await prisma.submission.findMany({
        where: {
          userId: user.id,
          problemId: problem.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          verdict: true,
          runtime: true,
          memory: true,
          language: true,
          createdAt: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      problem: {
        id: problem.id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        tags: problem.tags,
        companies: problem.companies,
        hints: problem.hints,
        constraints: problem.constraints,
        examples: problem.examples as {
          input: string;
          output: string;
          explanation?: string;
        }[],
        testCases: problem.testCases
          .filter(tc => !tc.isHidden)
          .map(tc => ({
            id: tc.id,
            input: tc.input,
            output: tc.output,
            orderIndex: tc.orderIndex,
            isHidden: false, // Already filtered
          })),
        totalTestCases: problem._count.testCases, // Total count including hidden
        inputFormat: problem.inputFormat,
        outputFormat: problem.outputFormat,
        timeLimit: problem.timeLimit,
        memoryLimit: problem.memoryLimit,
        createdAt: problem.createdAt.toISOString(),
        updatedAt: problem.updatedAt.toISOString(),
        publishedAt: problem.publishedAt,
        acceptanceRate,
        totalSubmissions,
        userStatus,
        userSubmissions,
      },
    });
  } catch (error) {
    console.error("Problem fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch problem" },
      { status: 500 },
    );
  }
}

// PATCH /api/problems/[slug] - Update problem (ADMIN only)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireAdmin();

    const { slug } = await params;
    const body = await req.json();

    const problem = await prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Update problem
    const updatedProblem = await prisma.problem.update({
      where: { id: problem.id },
      data: {
        title: body.title,
        description: body.description,
        difficulty: body.difficulty,
        tags: body.tags,
        companies: body.companies,
        hints: body.hints,
        constraints: body.constraints,
        inputFormat: body.inputFormat,
        outputFormat: body.outputFormat,
        examples: body.examples,
      },
    });

    return NextResponse.json({
      success: true,
      problem: updatedProblem,
    });
  } catch (error) {
    console.error("Problem update error:", error);
    return NextResponse.json(
      { error: "Failed to update problem" },
      { status: 500 },
    );
  }
}

// DELETE /api/problems/[slug] - Delete problem (ADMIN only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    await requireAdmin();

    const { slug } = await params;

    const problem = await prisma.problem.findUnique({
      where: { slug },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Delete problem (cascade will handle related records)
    await prisma.problem.delete({
      where: { id: problem.id },
    });

    return NextResponse.json({
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    console.error("Problem deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete problem" },
      { status: 500 },
    );
  }
}
