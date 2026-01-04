import NextAuth, { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";

const isProduction = process.env.NODE_ENV === "production";

// Edge-compatible auth config (no bcryptjs, no Prisma in callbacks)
// Used by middleware for session checking only
export const authConfigEdge: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    // Note: Credentials provider not included - requires bcrypt (Node.js only)
  ],
  session: {
    strategy: "jwt" as const,
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProduction,
        domain: isProduction ? "algoloom.sadman.me" : undefined,
      },
    },
  },
  callbacks: {
    // JWT callback: Edge only decodes tokens, main auth.ts handles encoding
    // Token data (id, role, username, etc.) is already set by auth.ts
    async jwt({ token }) {
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.emailVerified = token.emailVerified ?? null;
        session.user.isPro = token.role === "ADMIN" || (token.isPro ?? false);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { auth: authEdge } = NextAuth(authConfigEdge);
