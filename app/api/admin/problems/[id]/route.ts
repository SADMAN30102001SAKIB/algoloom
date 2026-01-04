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
    // Handle Prisma unique constraint errors gracefully
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json({ error: "Slug or unique field already exists" }, { status: 409 });
      }
    }

    return NextResponse.json({ error: "Failed to update problem" }, { status: 500 });
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
    return NextResponse.json({ error: "Failed to delete problem" }, { status: 500 });
  }
}
