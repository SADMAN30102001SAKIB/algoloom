import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

export interface HintRequest {
  problemTitle: string;
  problemDescription: string;
  difficulty: string;
  userLevel: number;
  attempts: number;
  languagesUsed: string[];
  hintLevel: number;
  userCode?: string;
  testCases?: { input: string; output: string }[];
}

export async function generateHint(request: HintRequest): Promise<string> {
  const prompt = buildHintPrompt(request);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate hint");
  }
}

function buildHintPrompt(request: HintRequest): string {
  const hintDepth =
    {
      1: "conceptual and high-level",
      2: "approach-focused with some specifics",
      3: "detailed with algorithmic guidance",
    }[request.hintLevel] || "conceptual";

  return `You are AlgoLoom's AI learning assistant. Your goal is to help users learn problem-solving skills WITHOUT giving away complete solutions.

PROBLEM CONTEXT:
- Title: ${request.problemTitle}
- Difficulty: ${request.difficulty}
- User Level: ${request.userLevel}
- Attempts: ${request.attempts}
- Languages Used: ${request.languagesUsed.join(", ")}

PROBLEM DESCRIPTION:
${request.problemDescription}
${
  request.userCode
    ? `
USER'S CURRENT CODE:
\`\`\`
${request.userCode}
\`\`\`

ANALYZE THE USER'S CODE:
- Identify what they're trying to do
- Point out logical errors or inefficiencies WITHOUT fixing them directly
- Guide them toward the right approach based on what they've attempted
`
    : ""
}
HINT LEVEL: ${request.hintLevel} (${hintDepth})

STRICT CONSTRAINTS:
1. DO NOT provide complete working code or solution
2. DO NOT reveal the exact algorithm step-by-step
3. GUIDE the user toward discovering the approach themselves
4. Use Socratic questioning when appropriate
5. Scale hint depth based on difficulty (harder problems = vaguer hints initially)
6. Focus on teaching problem-solving patterns, not memorization
${request.userCode ? "7. Reference specific issues in their code when relevant, but don't rewrite it for them" : ""}

HINT LEVEL GUIDELINES:
- Level 1: Point to the general approach or data structure category. Ask guiding questions.
- Level 2: Discuss the algorithmic pattern and why it fits. Mention edge cases to consider.
- Level 3: Provide more specific guidance on implementation details, but still no complete code.

USER CONTEXT CONSIDERATION:
${
  request.attempts === 1
    ? "This is their first attempt - be encouraging but don't over-explain."
    : request.attempts > 5
      ? "Multiple attempts detected - provide more concrete guidance while still teaching."
      : "A few attempts made - balance between guidance and learning."
}

Generate a helpful, educational hint that respects these constraints:`;
}
