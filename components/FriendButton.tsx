"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { UserPlus, UserCheck, Clock, UserMinus, Loader2 } from "lucide-react";

type FriendshipStatus =
  | "none"
  | "pending_sent"
  | "pending_received"
  | "friends";

interface FriendButtonProps {
  targetUserId: string;
  targetUsername: string;
  className?: string;
}

export default function FriendButton({
  targetUserId,
  targetUsername,
  className = "",
}: FriendButtonProps) {
  const { data: session } = useSession();
  const [status, setStatus] = useState<FriendshipStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Don't show button for own profile
  const isOwnProfile = session?.user?.id === targetUserId;

  useEffect(() => {
    async function checkFriendshipStatus() {
      try {
        const res = await fetch("/api/friends");
        const data = await res.json();

        if (data.success) {
          // Check if already friends
          const friend = data.friends?.find(
            (f: { user: { id: string } }) => f.user.id === targetUserId,
          );
          if (friend) {
            setStatus("friends");
            setFriendshipId(friend.friendshipId);
            setLoading(false);
            return;
          }

          // Check if we sent them a request
          const sentRequest = data.sentRequests?.find(
            (r: { user: { id: string } }) => r.user.id === targetUserId,
          );
          if (sentRequest) {
            setStatus("pending_sent");
            setFriendshipId(sentRequest.friendshipId);
            setLoading(false);
            return;
          }

          // Check if they sent us a request
          const pendingRequest = data.pendingRequests?.find(
            (r: { user: { id: string } }) => r.user.id === targetUserId,
          );
          if (pendingRequest) {
            setStatus("pending_received");
            setFriendshipId(pendingRequest.friendshipId);
            setLoading(false);
            return;
          }

          setStatus("none");
        }
      } catch (error) {
        console.error("Failed to check friendship status:", error);
      } finally {
        setLoading(false);
      }
    }

    if (session?.user && !isOwnProfile) {
      checkFriendshipStatus();
    } else {
      setLoading(false);
    }
  }, [session, targetUserId, isOwnProfile]);

  async function handleAddFriend() {
    setActionLoading(true);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId: targetUserId }),
      });

      const data = await res.json();

      if (data.success) {
        if (data.status === "ACCEPTED") {
          setStatus("friends");
        } else {
          setStatus("pending_sent");
        }
        setFriendshipId(data.friendshipId);
      }
    } catch (error) {
      console.error("Failed to send friend request:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAccept() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        setStatus("friends");
      }
    } catch (error) {
      console.error("Failed to accept:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!friendshipId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStatus("none");
        setFriendshipId(null);
      }
    } catch (error) {
      console.error("Failed to cancel:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUnfriend() {
    if (!friendshipId) return;
    if (!confirm(`Unfriend @${targetUsername}?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setStatus("none");
        setFriendshipId(null);
      }
    } catch (error) {
      console.error("Failed to unfriend:", error);
    } finally {
      setActionLoading(false);
    }
  }

  // Don't show for own profile or if not logged in
  if (isOwnProfile || !session?.user) {
    return null;
  }

  if (loading) {
    return (
      <div className={`px-4 py-2 bg-zinc-800 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
      </div>
    );
  }

  if (actionLoading) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-400 rounded-lg ${className}`}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </button>
    );
  }

  switch (status) {
    case "none":
      return (
        <button
          onClick={handleAddFriend}
          className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ${className}`}>
          <UserPlus className="w-4 h-4" />
          Add Friend
        </button>
      );

    case "pending_sent":
      return (
        <button
          onClick={handleCancel}
          className={`flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors ${className}`}>
          <Clock className="w-4 h-4" />
          Pending
        </button>
      );

    case "pending_received":
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <button
            onClick={handleAccept}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            <UserCheck className="w-4 h-4" />
            Accept
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors">
            <UserMinus className="w-4 h-4" />
          </button>
        </div>
      );

    case "friends":
      return (
        <button
          onClick={handleUnfriend}
          className={`flex items-center gap-2 px-4 py-2 bg-zinc-800 text-emerald-500 rounded-lg hover:bg-zinc-700 transition-colors ${className}`}>
          <UserCheck className="w-4 h-4" />
          Friends
        </button>
      );

    default:
      return null;
  }
}
