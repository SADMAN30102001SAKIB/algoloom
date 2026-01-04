import NextAuth, { NextAuthConfig } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// Force Node.js runtime (bcryptjs requires Node.js APIs)
export const runtime = "nodejs";

export const authConfig: NextAuthConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.password) {
          throw new Error("Invalid credentials");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          image: user.image,
          role: user.role,
          emailVerified: user.emailVerified,
          isPro: user.isPro,
        };
      },
    }),
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
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production"
            ? "algoloom.sadman.me"
            : undefined,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production"
            ? "algoloom.sadman.me"
            : undefined,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain:
          process.env.NODE_ENV === "production"
            ? "algoloom.sadman.me"
            : undefined,
      },
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      // For OAuth providers, ensure user exists in database
      if (account?.provider === "google" || account?.provider === "github") {
        if (!user.email) {
          return false;
        }

        // Use upsert to avoid race conditions
        const username =
          user.email!.split("@")[0] + Math.floor(Math.random() * 1000);

        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            // Update last login info
            name: user.name,
            image: user.image,
            // Ensure OAuth users are always verified
            emailVerified: new Date(),
          },
          create: {
            email: user.email!,
            username: username,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            role: "USER",
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // For OAuth providers, fetch user data from database since NextAuth's user object
      // only contains provider data (email, name, image), not our database fields
      if (account && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: {
            id: true,
            role: true,
            username: true,
            emailVerified: true,
            isPro: true,
            subscription: {
              select: { plan: true },
            },
          },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.username = dbUser.username;
          token.emailVerified = dbUser.emailVerified;
          token.isPro = dbUser.isPro;
          token.subscriptionPlan = dbUser.subscription?.plan ?? null;
        }
      } else if (user?.id) {
        // For credentials provider, user object already has database fields
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.emailVerified = user.emailVerified;
        token.isPro = user.isPro;
        token.subscriptionPlan = user.subscriptionPlan;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.emailVerified = token.emailVerified ?? null;
        // Use cached token data (Edge-compatible)
        // Fresh data is fetched via API calls when needed
        session.user.isPro = token.role === "ADMIN" || (token.isPro ?? false);
        session.user.subscriptionPlan = token.subscriptionPlan ?? null;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Allow relative URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allow same-origin absolute URLs
      if (new URL(url).origin === baseUrl) return url;
      // Default redirect will be handled by client-side based on role
      return `${baseUrl}/problems`;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Helper function to get current authenticated user from database
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

// Helper function to require authentication (throws if not authenticated)
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

// Helper function to require admin role
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}
