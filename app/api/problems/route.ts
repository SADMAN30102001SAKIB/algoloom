import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireAdmin } from "@/lib/auth";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface TestCaseInput {
  input: string;
  output: string;
  expectedOutputs?: string[];
  isHidden?: boolean;
}

// GET /api/problems - List problems with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const difficulty = searchParams.get("difficulty");
    const tags = searchParams.get("tags");
    const status = searchParams.get("status");
    const company = searchParams.get("company");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const order = searchParams.get("order") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get current user for status filtering
    const user = await getCurrentUser();
    const userId = user?.id || null;
    const isAdmin = user?.role === "ADMIN";

    // Build where clause
    const where: Prisma.ProblemWhereInput = {};

    // Only show published problems to non-admin users
    if (!isAdmin) {
      where.publishedAt = {
        not: null,
      };
    }

    if (difficulty) {
      where.difficulty = difficulty as "EASY" | "MEDIUM" | "HARD";
    }

    // Store tags for post-filtering (case-insensitive substring match)
    let tagFilters: string[] | null = null;
    if (tags) {
      tagFilters = tags.split(",").map(t => t.trim().toLowerCase());
    }

    if (company) {
      where.companies = {
        has: company,
      };
    }

    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    // Status filtering requires user to be logged in
    if (status && userId) {
      if (status === "SOLVED") {
        where.problemStats = {
          some: {
            userId,
            status: "SOLVED",
          },
        };
      } else if (status === "ATTEMPTED") {
        where.problemStats = {
          some: {
            userId,
            status: "ATTEMPTED",
          },
        };
      } else if (status === "UNTOUCHED") {
        where.problemStats = {
          none: {
            userId,
          },
        };
      }
    }

    // Fetch problems (we'll filter tags in memory)
    let allProblems = await prisma.problem.findMany({
      where,
      include: {
        _count: {
          select: {
            submissions: true,
          },
        },
        problemStats: userId
          ? {
              where: {
                userId,
              },
              select: {
                status: true,
                attempts: true,
                hintsUsed: true,
              },
            }
          : false,
      },
      orderBy: {
        [sortBy]: order as "asc" | "desc",
      },
    });

    // Apply tag filtering (case-insensitive substring match)
    if (tagFilters && tagFilters.length > 0) {
      allProblems = allProblems.filter(problem => {
        return tagFilters.every(filterTag =>
          problem.tags.some(problemTag =>
            problemTag.toLowerCase().includes(filterTag),
          ),
        );
      });
    }

    // Get total count after tag filtering
    const totalCount = allProblems.length;

    // Apply pagination
    const problems = allProblems.slice((page - 1) * limit, page * limit);

    // Calculate acceptance rate for each problem
    const problemsWithStats = await Promise.all(
      problems.map(async problem => {
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

        return {
          id: problem.id,
          title: problem.title,
          slug: problem.slug,
          difficulty: problem.difficulty,
          tags: problem.tags,
          companies: problem.companies,
          isPremium: problem.isPremium,
          acceptanceRate,
          totalSubmissions,
          status: problem.problemStats?.[0]?.status || "UNTOUCHED",
          attempts: problem.problemStats?.[0]?.attempts || 0,
          hintsUsed: problem.problemStats?.[0]?.hintsUsed || false,
        };
      }),
    );

    return NextResponse.json({
      success: true,
      problems: problemsWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Problem fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch problems" },
      { status: 500 },
    );
  }
}

// POST /api/problems - Create new problem (ADMIN only)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const {
      title,
      description,
      difficulty,
      tags,
      companies,
      hints,
      constraints,
      testCases,
      inputFormat,
      outputFormat,
      examples,
    } = body;

    // Validate required fields
    if (
      !title ||
      !description ||
      !difficulty ||
      !testCases ||
      testCases.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingProblem = await prisma.problem.findUnique({
      where: { slug },
    });

    if (existingProblem) {
      return NextResponse.json(
        { error: "Problem with this title already exists" },
        { status: 409 },
      );
    }

    // Create problem with test cases
    const problem = await prisma.problem.create({
      data: {
        title,
        slug,
        description,
        difficulty,
        tags: tags || [],
        companies: companies || [],
        hints: hints || [],
        constraints: constraints || [],
        inputFormat: inputFormat || "",
        outputFormat: outputFormat || "",
        examples: examples || [],
        testCases: {
          create: testCases.map((tc: TestCaseInput, index: number) => ({
            input: tc.input,
            output: tc.output,
            isHidden: tc.isHidden !== undefined ? tc.isHidden : index >= 2,
          })),
        },
      },
      include: {
        testCases: true,
      },
    });

    return NextResponse.json({
      success: true,
      problem,
    });
  } catch (error) {
    console.error("Problem creation error:", error);
    return NextResponse.json(
      { error: "Failed to create problem" },
      { status: 500 },
    );
  }
}
