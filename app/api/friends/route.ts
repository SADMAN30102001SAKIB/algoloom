import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends
 * Get user's friends list and pending requests
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // all, friends, pending, sent

    // Get friendships where user is either sender or receiver
    const [sentFriendships, receivedFriendships] = await Promise.all([
      // Requests I sent
      prisma.friendship.findMany({
        where: { userId: user.id },
        include: {
          User_Friendship_friendIdToUser: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              xp: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      // Requests I received
      prisma.friendship.findMany({
        where: { friendId: user.id },
        include: {
          User_Friendship_userIdToUser: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              xp: true,
              level: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Process into categories
    const friends: Array<{
      friendshipId: string;
      user: {
        id: string;
        name: string | null;
        username: string;
        image: string | null;
        xp: number;
        level: number;
      };
      since: Date;
    }> = [];

    const pendingRequests: Array<{
      friendshipId: string;
      user: {
        id: string;
        name: string | null;
        username: string;
        image: string | null;
        xp: number;
        level: number;
      };
      sentAt: Date;
    }> = [];

    const sentRequests: Array<{
      friendshipId: string;
      user: {
        id: string;
        name: string | null;
        username: string;
        image: string | null;
        xp: number;
        level: number;
      };
      sentAt: Date;
    }> = [];

    // Process sent friendships
    for (const f of sentFriendships) {
      const friendUser = f.User_Friendship_friendIdToUser;
      if (f.status === "ACCEPTED") {
        friends.push({
          friendshipId: f.id,
          user: friendUser,
          since: f.createdAt,
        });
      } else if (f.status === "PENDING") {
        sentRequests.push({
          friendshipId: f.id,
          user: friendUser,
          sentAt: f.createdAt,
        });
      }
    }

    // Process received friendships
    for (const f of receivedFriendships) {
      const friendUser = f.User_Friendship_userIdToUser;
      if (f.status === "ACCEPTED") {
        // Check if already added (avoid duplicates)
        if (!friends.find(fr => fr.user.id === friendUser.id)) {
          friends.push({
            friendshipId: f.id,
            user: friendUser,
            since: f.createdAt,
          });
        }
      } else if (f.status === "PENDING") {
        pendingRequests.push({
          friendshipId: f.id,
          user: friendUser,
          sentAt: f.createdAt,
        });
      }
    }

    // Filter by type
    let result;
    switch (type) {
      case "friends":
        result = { friends };
        break;
      case "pending":
        result = { pendingRequests };
        break;
      case "sent":
        result = { sentRequests };
        break;
      default:
        result = { friends, pendingRequests, sentRequests };
    }

    return NextResponse.json({
      success: true,
      ...result,
      counts: {
        friends: friends.length,
        pending: pendingRequests.length,
        sent: sentRequests.length,
      },
    });
  } catch (error) {
    console.error("Friends fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch friends" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/friends
 * Send a friend request
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { friendId, username } = body;

    // Get friend by ID or username
    let targetUser;
    if (friendId) {
      targetUser = await prisma.user.findUnique({
        where: { id: friendId },
        select: { id: true, username: true },
      });
    } else if (username) {
      targetUser = await prisma.user.findUnique({
        where: { username },
        select: { id: true, username: true },
      });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === user.id) {
      return NextResponse.json(
        { error: "Cannot send friend request to yourself" },
        { status: 400 },
      );
    }

    // Check if friendship already exists (in either direction)
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: user.id, friendId: targetUser.id },
          { userId: targetUser.id, friendId: user.id },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === "ACCEPTED") {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
      }
      if (existingFriendship.status === "PENDING") {
        // If they sent us a request, auto-accept
        if (existingFriendship.userId === targetUser.id) {
          await prisma.friendship.update({
            where: { id: existingFriendship.id },
            data: { status: "ACCEPTED" },
          });
          return NextResponse.json({
            success: true,
            message: "Friend request accepted",
            friendshipId: existingFriendship.id,
            status: "ACCEPTED",
          });
        }
        return NextResponse.json(
          { error: "Friend request already sent" },
          { status: 400 },
        );
      }
      if (existingFriendship.status === "REJECTED") {
        // Allow re-sending after rejection
        await prisma.friendship.update({
          where: { id: existingFriendship.id },
          data: { status: "PENDING", userId: user.id, friendId: targetUser.id },
        });
        return NextResponse.json({
          success: true,
          message: "Friend request sent",
          friendshipId: existingFriendship.id,
          status: "PENDING",
        });
      }
    }

    // Create new friendship request
    const friendship = await prisma.friendship.create({
      data: {
        userId: user.id,
        friendId: targetUser.id,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Friend request sent",
      friendshipId: friendship.id,
      status: "PENDING",
    });
  } catch (error) {
    console.error("Friend request error:", error);
    return NextResponse.json(
      { error: "Failed to send friend request" },
      { status: 500 },
    );
  }
}
