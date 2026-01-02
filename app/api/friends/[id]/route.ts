import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/friends/[id]
 * Accept or decline a friend request
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body; // "accept" or "decline"

    if (!["accept", "decline"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Use 'accept' or 'decline'" },
        { status: 400 },
      );
    }

    // Find the friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friend request not found" },
        { status: 404 },
      );
    }

    // Only the recipient can accept/decline
    if (friendship.friendId !== user.id) {
      return NextResponse.json(
        { error: "You can only respond to requests sent to you" },
        { status: 403 },
      );
    }

    if (friendship.status !== "PENDING") {
      return NextResponse.json(
        { error: "This request has already been responded to" },
        { status: 400 },
      );
    }

    // Update friendship status
    const newStatus = action === "accept" ? "ACCEPTED" : "REJECTED";
    await prisma.friendship.update({
      where: { id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      message:
        action === "accept"
          ? "Friend request accepted"
          : "Friend request declined",
      status: newStatus,
    });
  } catch (error) {
    console.error("Friend action error:", error);
    return NextResponse.json(
      { error: "Failed to process friend request" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/friends/[id]
 * Unfriend or cancel a pending request
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Find the friendship
    const friendship = await prisma.friendship.findUnique({
      where: { id },
    });

    if (!friendship) {
      return NextResponse.json(
        { error: "Friendship not found" },
        { status: 404 },
      );
    }

    // User must be part of this friendship
    if (friendship.userId !== user.id && friendship.friendId !== user.id) {
      return NextResponse.json(
        { error: "You are not part of this friendship" },
        { status: 403 },
      );
    }

    // Delete the friendship
    await prisma.friendship.delete({
      where: { id },
    });

    const message =
      friendship.status === "PENDING"
        ? friendship.userId === user.id
          ? "Friend request cancelled"
          : "Friend request declined"
        : "Unfriended successfully";

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Unfriend error:", error);
    return NextResponse.json({ error: "Failed to unfriend" }, { status: 500 });
  }
}
