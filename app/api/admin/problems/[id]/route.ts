import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface TestCaseInput {
  input: string;
  output: string;
  expectedOutputs?: string[];
  isHidden?: boolean;
}

// Update problem
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const data = await req.json();
    const { testCases, examples, ...problemData } = data;

    // Delete existing test cases
    await prisma.testCase.deleteMany({
      where: { problemId: id },
    });

    // Update problem with new test cases
    const problem = await prisma.problem.update({
      where: { id },
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
    console.error("Error updating problem:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update problem",
      },
      { status: 500 },
    );
  }
}

// Delete problem
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    await prisma.problem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting problem:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete problem",
      },
      { status: 500 },
    );
  }
}
