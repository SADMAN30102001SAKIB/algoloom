import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProblemForm from "../ProblemForm";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const problem = await prisma.problem.findUnique({
    where: { slug },
    include: {
      testCases: {
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!problem) {
    notFound();
  }

  // Transform the problem data to match ProblemForm expectations
  const transformedProblem = {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    tags: problem.tags,
    companies: problem.companies,
    constraints: problem.constraints,
    hints: problem.hints,
    examples: problem.examples as {
      input: string;
      output: string;
      explanation: string | null;
    }[],
    inputFormat: problem.inputFormat,
    outputFormat: problem.outputFormat,
    timeLimit: problem.timeLimit,
    memoryLimit: problem.memoryLimit,
    publishedAt: problem.publishedAt?.toISOString() || null,
    isPremium: problem.isPremium,
    testCases: problem.testCases,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Edit Problem</h1>
        <p className="text-slate-400">Update problem details and test cases</p>
      </div>

      <ProblemForm problem={transformedProblem} />
    </div>
  );
}
