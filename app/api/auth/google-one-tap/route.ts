import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Cookie name must match what NextAuth expects
// NextAuth uses "next-auth.session-token" as the base name
// The salt for encoding must also match
const COOKIE_NAME = "next-auth.session-token";

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { error: "No credential provided" },
        { status: 400 },
      );
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid token payload" },
        { status: 400 },
      );
    }

    const { email, name, picture } = payload;

    if (!email) {
      return NextResponse.json({ error: "No email in token" }, { status: 400 });
    }

    // Find or create user using upsert to avoid race conditions
    const username =
      email.split("@")[0] + "_" + Math.random().toString(36).substring(2, 6);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        // Update image if user doesn't have one
        ...(picture ? { image: picture } : {}),
        // Mark as verified since Google accounts are verified
        emailVerified: new Date(),
      },
      create: {
        email,
        name: name || email.split("@")[0],
        username,
        image: picture,
        emailVerified: new Date(),
      },
    });

    const isProduction = process.env.NODE_ENV === "production";

    // Use NextAuth's encode function to create a properly formatted JWT
    // Salt must match the cookie name NextAuth uses for decoding
    const token = await encode({
      token: {
        name: user.name,
        email: user.email,
        picture: user.image,
        sub: user.id,
        id: user.id,
        username: user.username,
        role: user.role,
        isPro: user.isPro,
        emailVerified: user.emailVerified,
      },
      secret: process.env.NEXTAUTH_SECRET!,
      salt: COOKIE_NAME,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    // Set the session cookie
    const cookieStore = await cookies();
    const productionDomain = process.env.COOKIE_DOMAIN || "algoloom.sadman.me";

    cookieStore.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
      domain: isProduction ? productionDomain : undefined,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Google One Tap error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
