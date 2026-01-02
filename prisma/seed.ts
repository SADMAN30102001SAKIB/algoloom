import { PrismaClient, AchievementCategory, Difficulty } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const seedsDir = path.join(process.cwd(), "prisma", "seeds");

interface TestCaseSeed {
  input: string;
  output: string;
  explanation?: string;
  isHidden: boolean;
  orderIndex: number;
  expectedOutputs?: string[];
}

interface ProblemSeed {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  constraints: string[];
  tags: string[];
  companies: string[];
  examples: { input: string; output: string; explanation?: string }[];
  hints: string[];
  inputFormat?: string;
  outputFormat?: string;
  timeLimit?: number;
  memoryLimit?: number;
  testCases: TestCaseSeed[];
}

interface AchievementSeed {
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  requirement: string;
  xpReward: number;
}

function loadJSON(filename: string): ProblemSeed[] {
  const p = path.join(seedsDir, filename);
  if (fs.existsSync(p)) {
    try {
      return JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      console.error("Failed to parse", p, e);
      return [];
    }
  }
  return [];
}

const easyProblems = loadJSON("easyProblemSeeds.json");
const mediumProblems = loadJSON("mediumProblemSeeds.json");
const hardProblems = loadJSON("hardProblemSeeds.json");

// Allow seeding only a single chunk by setting SEED_CHUNK env var to 'easy'|'medium'|'hard'.
const SEED_CHUNK = (process.env.SEED_CHUNK || "all").toLowerCase();
let SAMPLE_PROBLEMS: ProblemSeed[] = [];
if (SEED_CHUNK === "easy") SAMPLE_PROBLEMS = easyProblems;
else if (SEED_CHUNK === "medium") SAMPLE_PROBLEMS = mediumProblems;
else if (SEED_CHUNK === "hard") SAMPLE_PROBLEMS = hardProblems;
else SAMPLE_PROBLEMS = [...easyProblems, ...mediumProblems, ...hardProblems];

const ACHIEVEMENTS: AchievementSeed[] = [
  // Milestone achievements - Problem solving progress
  {
    slug: "first-blood",
    name: "First Blood",
    description: "Solve your first problem",
    icon: "🎯",
    category: "MILESTONE",
    requirement: "solve_1",
    xpReward: 20,
  },
  {
    slug: "getting-started",
    name: "Getting Started",
    description: "Solve 5 problems",
    icon: "🌱",
    category: "MILESTONE",
    requirement: "solve_5",
    xpReward: 50,
  },
  {
    slug: "problem-solver",
    name: "Problem Solver",
    description: "Solve 10 problems",
    icon: "🔥",
    category: "MILESTONE",
    requirement: "solve_10",
    xpReward: 100,
  },
  {
    slug: "dedicated",
    name: "Dedicated",
    description: "Solve 25 problems",
    icon: "💪",
    category: "MILESTONE",
    requirement: "solve_25",
    xpReward: 250,
  },
  {
    slug: "centurion",
    name: "Centurion",
    description: "Solve 100 problems",
    icon: "🏆",
    category: "MILESTONE",
    requirement: "solve_100",
    xpReward: 1000,
  },

  // Mastery achievements - Difficulty-based
  {
    slug: "easy-peasy",
    name: "Easy Peasy",
    description: "Solve 10 easy problems",
    icon: "🟢",
    category: "MASTERY",
    requirement: "easy_10",
    xpReward: 50,
  },
  {
    slug: "medium-rare",
    name: "Medium Rare",
    description: "Solve 10 medium problems",
    icon: "🟡",
    category: "MASTERY",
    requirement: "medium_10",
    xpReward: 100,
  },
  {
    slug: "hardcore",
    name: "Hardcore",
    description: "Solve 10 hard problems",
    icon: "🔴",
    category: "MASTERY",
    requirement: "hard_10",
    xpReward: 200,
  },
  {
    slug: "perfectionist",
    name: "Perfectionist",
    description: "Solve a problem on first attempt",
    icon: "✨",
    category: "MASTERY",
    requirement: "first_attempt",
    xpReward: 30,
  },

  // Streak achievements
  {
    slug: "on-fire",
    name: "On Fire",
    description: "Maintain a 3-day solving streak",
    icon: "🔥",
    category: "STREAK",
    requirement: "streak_3",
    xpReward: 30,
  },
  {
    slug: "unstoppable",
    name: "Unstoppable",
    description: "Maintain a 7-day solving streak",
    icon: "⚡",
    category: "STREAK",
    requirement: "streak_7",
    xpReward: 70,
  },
  {
    slug: "committed",
    name: "Committed",
    description: "Maintain a 30-day solving streak",
    icon: "💎",
    category: "STREAK",
    requirement: "streak_30",
    xpReward: 300,
  },

  // Level achievements
  {
    slug: "level-5",
    name: "Rising Star",
    description: "Reach level 5",
    icon: "⭐",
    category: "LEVEL",
    requirement: "level_5",
    xpReward: 50,
  },
  {
    slug: "level-10",
    name: "Veteran",
    description: "Reach level 10",
    icon: "🌟",
    category: "LEVEL",
    requirement: "level_10",
    xpReward: 100,
  },
  {
    slug: "level-25",
    name: "Master",
    description: "Reach level 25",
    icon: "👑",
    category: "LEVEL",
    requirement: "level_25",
    xpReward: 250,
  },

  // Exploration achievements
  {
    slug: "polyglot",
    name: "Polyglot",
    description: "Solve problems in 3 different languages",
    icon: "🌐",
    category: "EXPLORATION",
    requirement: "languages_3",
    xpReward: 75,
  },
  {
    slug: "tag-explorer",
    name: "Tag Explorer",
    description: "Solve problems from 5 different tags",
    icon: "🏷️",
    category: "EXPLORATION",
    requirement: "tags_5",
    xpReward: 50,
  },

  // Special achievements
  {
    slug: "night-owl",
    name: "Night Owl",
    description: "Solve a problem between midnight and 5 AM",
    icon: "🦉",
    category: "SPECIAL",
    requirement: "night_solve",
    xpReward: 25,
  },
  {
    slug: "early-bird",
    name: "Early Bird",
    description: "Solve a problem between 5 AM and 7 AM",
    icon: "🐦",
    category: "SPECIAL",
    requirement: "morning_solve",
    xpReward: 25,
  },
  {
    slug: "no-hints",
    name: "Pure Skill",
    description: "Solve 10 problems without using any hints",
    icon: "🧠",
    category: "SPECIAL",
    requirement: "no_hints_10",
    xpReward: 100,
  },
];

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@algoloom.com" },
    update: {},
    create: {
      email: "admin@algoloom.com",
      username: "admin",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
      xp: 1000,
      level: 11, // Math.floor(1000 / 100) + 1 = 11
    },
  });
  console.log("✅ Admin user created:", admin.email);

  // Create achievements
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      update: {},
      create: achievement,
    });
  }
  console.log("✅ Achievements created");

  // Create sample problems
  for (const problem of SAMPLE_PROBLEMS) {
    const { testCases, ...problemData } = problem;
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {},
      create: {
        ...problemData,
        publishedAt: new Date(),
        testCases: {
          create: testCases,
        },
      },
    });
  }
  console.log("✅ Sample problems created");

  console.log("🎉 Seeding completed!");
}

main()
  .catch(e => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
