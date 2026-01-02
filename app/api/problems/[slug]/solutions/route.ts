import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/problems/[slug]/solutions - Get best runtime and memory solutions
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    // Find the problem
    const problem = await prisma.problem.findUnique({
      where: { slug },
      select: { id: true, publishedAt: true },
    });

    if (!problem) {
      return NextResponse.json({ error: "Problem not found" }, { status: 404 });
    }

    // Check if problem is published (admins can see solutions for unpublished problems)
    const user = await getCurrentUser();
    const isAdmin = user?.role === "ADMIN";

    if (!problem.publishedAt && !isAdmin) {
      return NextResponse.json(
        { error: "Problem not found or not yet published." },
        { status: 404 },
      );
    }

    // Find all ACCEPTED submissions for this problem
    const acceptedSubmissions = await prisma.submission.findMany({
      where: {
        problemId: problem.id,
        verdict: "ACCEPTED",
        runtime: { not: null },
        memory: { not: null },
      },
      select: {
        id: true,
        code: true,
        language: true,
        runtime: true,
        memory: true,
        submittedAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (acceptedSubmissions.length === 0) {
      return NextResponse.json({
        success: true,
        bestRuntime: null,
        bestMemory: null,
      });
    }

    // Find the minimum runtime and memory values
    const minRuntime = Math.min(
      ...acceptedSubmissions.map(s => s.runtime || Infinity),
    );
    const minMemory = Math.min(
      ...acceptedSubmissions.map(s => s.memory || Infinity),
    );

    // Check if there's a solution that has BOTH the minimum runtime AND minimum memory
    const bestOverallSubmission = acceptedSubmissions.find(
      submission =>
        submission.runtime === minRuntime && submission.memory === minMemory,
    );

    // If there's a solution with both best runtime and best memory, show only that
    if (bestOverallSubmission) {
      return NextResponse.json({
        success: true,
        isSameSolution: true,
        bestRuntime: {
          id: bestOverallSubmission.id,
          code: bestOverallSubmission.code,
          language: bestOverallSubmission.language,
          runtime: bestOverallSubmission.runtime,
          memory: bestOverallSubmission.memory,
          username: bestOverallSubmission.user.username,
          submittedAt: bestOverallSubmission.submittedAt,
        },
        bestMemory: null,
      });
    }

    // Otherwise, find separate best runtime and best memory solutions
    const bestRuntimeSubmission = acceptedSubmissions.reduce((best, current) =>
      (current.runtime || Infinity) < (best.runtime || Infinity)
        ? current
        : best,
    );

    const bestMemorySubmission = acceptedSubmissions.reduce((best, current) =>
      (current.memory || Infinity) < (best.memory || Infinity) ? current : best,
    );

    const isSameSolution = bestRuntimeSubmission.id === bestMemorySubmission.id;

    return NextResponse.json({
      success: true,
      isSameSolution,
      bestRuntime: {
        id: bestRuntimeSubmission.id,
        code: bestRuntimeSubmission.code,
        language: bestRuntimeSubmission.language,
        runtime: bestRuntimeSubmission.runtime,
        memory: bestRuntimeSubmission.memory,
        username: bestRuntimeSubmission.user.username,
        submittedAt: bestRuntimeSubmission.submittedAt,
      },
      bestMemory: isSameSolution
        ? null
        : {
            id: bestMemorySubmission.id,
            code: bestMemorySubmission.code,
            language: bestMemorySubmission.language,
            runtime: bestMemorySubmission.runtime,
            memory: bestMemorySubmission.memory,
            username: bestMemorySubmission.user.username,
            submittedAt: bestMemorySubmission.submittedAt,
          },
    });
  } catch (error) {
    console.error("Solutions fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch solutions" },
      { status: 500 },
    );
  }
}
