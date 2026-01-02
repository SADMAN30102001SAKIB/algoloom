import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the submission
    const submission = await prisma.submission.findUnique({
      where: { id },
      select: {
        userId: true,
      },
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 },
      );
    }

    // Check if user owns this submission or is admin
    const isOwner = submission.userId === currentUser.id;
    const isAdmin = currentUser.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: "You can only delete your own submissions" },
        { status: 403 },
      );
    }

    // Delete submission (cascade will delete test results)
    await prisma.submission.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Submission deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 },
    );
  }
}
