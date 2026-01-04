import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AlgoLoom - Master Algorithms with AI-Powered Hints",
  description:
    "Level up your coding skills with AlgoLoom. Solve algorithmic problems, get AI-powered hints, and compete on the leaderboard.",
  keywords: [
    "algorithms",
    "coding",
    "leetcode",
    "programming",
    "ai hints",
    "gamification",
  ],
  authors: [{ name: "AlgoLoom" }],
  openGraph: {
    title: "AlgoLoom - Master Algorithms with AI-Powered Hints",
    description:
      "Level up your coding skills with AlgoLoom. Solve algorithmic problems, get AI-powered hints, and compete on the leaderboard.",
    type: "website",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.svg" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
