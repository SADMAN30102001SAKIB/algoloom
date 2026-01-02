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

    return NextResponse.json({
      submissions,
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
