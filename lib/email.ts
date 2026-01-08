import prisma from "@/lib/prisma";
import crypto from "crypto";

// Generate verification token
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Store verification token in database
export async function createVerificationToken(
  email: string,
  token: string,
): Promise<void> {
  // Delete any existing tokens for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: email },
  });

  // Create new token (expires in 1 hour)
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + 3600 * 1000), // 1 hour
    },
  });
}

// Generate password reset token
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Store password reset token in database
export async function createPasswordResetToken(
  email: string,
  token: string,
): Promise<void> {
  // Delete any existing tokens for this email
  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  // Create new token (expires in 1 hour)
  await prisma.passwordResetToken.create({
    data: {
      email,
      token,
      expires: new Date(Date.now() + 3600 * 1000), // 1 hour
    },
  });
}

// Verify token
export async function verifyToken(
  email: string,
  token: string,
): Promise<boolean> {
  const verificationToken = await prisma.verificationToken.findUnique({
    where: {
      identifier_token: {
        identifier: email,
        token,
      },
    },
  });

  if (!verificationToken) {
    return false;
  }

  // Check if token is expired
  if (verificationToken.expires < new Date()) {
    // Try to delete expired token, but don't fail if it doesn't exist
    try {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: email,
            token,
          },
        },
      });
    } catch {
      // Token already deleted, ignore
    }
    return false;
  }

  // Token is valid - delete it and mark user as verified
  try {
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: email,
          token,
        },
      },
    });
  } catch {
    // Token already deleted, check if user is already verified
    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    // If user is already verified, return true (successful verification)
    if (user?.emailVerified) {
      return true;
    }

    // Otherwise, token was deleted but user not verified (error state)
    return false;
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  return true;
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  name: string,
  token: string,
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`;

  // If RESEND_API_KEY is not set, log to console (development mode)
  if (!process.env.RESEND_API_KEY) {
    console.log("\n=================================");
    console.log("📧 EMAIL VERIFICATION");
    console.log("=================================");
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log("=================================\n");
    return true;
  }

  try {
    // Use Resend API to send email
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "AlgoLoom <onboarding@resend.dev>",
        to: email,
        subject: "Verify your AlgoLoom account",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">AlgoLoom</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Welcome to AlgoLoom, ${name}!</h2>
                <p style="color: #4b5563; font-size: 16px;">Thanks for signing up! Please verify your email address to start solving problems and earning XP.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${verificationUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Verify Email</a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
                <p style="color: #667eea; font-size: 14px; word-break: break-all;">${verificationUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">This link will expire in 1 hour. If you didn't create an account, you can safely ignore this email.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    return false;
  }
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  token: string,
): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

  // If RESEND_API_KEY is not set, log to console (development mode)
  if (!process.env.RESEND_API_KEY) {
    console.log("\n=================================");
    console.log("📧 PASSWORD RESET EMAIL");
    console.log("=================================");
    console.log(`To: ${email}`);
    console.log(`Name: ${name}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=================================\n");
    return true;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "AlgoLoom <onboarding@resend.dev>",
        to: email,
        subject: "Reset your AlgoLoom password",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">AlgoLoom</h1>
              </div>
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
                <p style="color: #4b5563; font-size: 16px;">Hello ${name}, we received a request to reset your password. Click the button below to choose a new one:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">Or copy and paste this link into your browser:</p>
                <p style="color: #667eea; font-size: 14px; word-break: break-all;">${resetUrl}</p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                <p style="color: #9ca3af; font-size: 13px; margin: 0;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send reset email:", await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error sending reset email:", error);
    return false;
  }
}
