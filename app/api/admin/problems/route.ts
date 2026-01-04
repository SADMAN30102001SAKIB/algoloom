import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface TestCaseInput {
  input: string;
  output: string;
  expectedOutputs?: string[];
  isHidden?: boolean;
}

// Create new problem
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const data = await req.json();

    const { testCases, examples, ...problemData } = data;

    const problem = await prisma.problem.create({
      data: {
        ...problemData,
        examples: examples || [],
        publishedAt: problemData.publishedAt
          ? new Date(problemData.publishedAt)
          : null,
        testCases: {
          create: (testCases || []).map((tc: TestCaseInput, index: number) => ({
            input: tc.input,
            output: tc.output,
            expectedOutputs: tc.expectedOutputs || [],
            isHidden: tc.isHidden,
            orderIndex: index,
          })),
        },
      },
      include: {
        testCases: true,
      },
    });

    return NextResponse.json(problem);
  } catch (error: unknown) {
    console.error("Error creating problem:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          { error: "Slug or unique field already exists" },
          { status: 409 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create problem" },
      { status: 500 },
    );
  }
}
