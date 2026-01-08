import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetToken, createPasswordResetToken, sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, emailVerified: true },
    });

    // For security, don't reveal if user exists or not
    // Just return success even if user not found (avoids email enumeration)
    if (!user) {
      return NextResponse.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
    }

    // Generate and store token
    const token = generatePasswordResetToken();
    await createPasswordResetToken(email, token);

    // Send email
    await sendPasswordResetEmail(email, user.name || "User", token);

    return NextResponse.json({ success: true, message: "If an account exists with this email, you will receive a password reset link." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "An error occurred. Please try again later." }, { status: 500 });
  }
}
