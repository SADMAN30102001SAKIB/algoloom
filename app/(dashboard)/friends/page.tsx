"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Clock,
  Check,
  X,
  UserMinus,
  Activity,
  Trophy,
  Target,
  Flame,
  Award,
} from "lucide-react";

interface Friend {
  friendshipId: string;
  user: {
    id: string;
    name: string | null;
    username: string;
    image: string | null;
    xp: number;
    level: number;
  };
  since?: Date;
  sentAt?: Date;
}

interface ActivityItem {
  id: string;
  type: "solved" | "achievement" | "streak" | "level" | "daily";
  user: {
    username: string;
    name: string | null;
    image: string | null;
  };
  data: {
    problemTitle?: string;
    problemSlug?: string;
    achievementName?: string;
    achievementIcon?: string;
    streakDays?: number;
    level?: number;
  };
  createdAt: string;
}

interface Counts {
  friends: number;
  pending: number;
  sent: number;
}

type TabType = "friends" | "requests" | "activity";

export default function FriendsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<Friend[]>([]);
  const [sentRequests, setSentRequests] = useState<Friend[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [counts, setCounts] = useState<Counts>({
    friends: 0,
    pending: 0,
    sent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetchFriends();
      fetchActivity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user]);

  async function fetchFriends() {
    try {
      const res = await fetch("/api/friends");
      const data = await res.json();

      if (data.success) {
        setFriends(data.friends || []);
        setPendingRequests(data.pendingRequests || []);
        setSentRequests(data.sentRequests || []);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Failed to fetch friends:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchActivity() {
    try {
      const res = await fetch("/api/friends/activity");
      const data = await res.json();

      if (data.success) {
        setActivity(data.activity || []);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  }

  async function handleAccept(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Failed to accept:", error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDecline(friendshipId: string) {
    setActionLoading(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Failed to decline:", error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnfriend(friendshipId: string) {
    if (!confirm("Are you sure you want to unfriend this user?")) return;

    setActionLoading(friendshipId);
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error("Failed to unfriend:", error);
    } finally {
      setActionLoading(null);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            Sign in to see friends
          </h1>
          <p className="text-zinc-400 mb-4">Connect with other developers</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const tabs: {
    id: TabType;
    label: string;
    count: number;
    icon: React.ElementType;
  }[] = [
    { id: "friends", label: "Friends", count: counts.friends, icon: Users },
    {
      id: "requests",
      label: "Requests",
      count: counts.pending,
      icon: UserPlus,
    },
    { id: "activity", label: "Activity", count: 0, icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-500" />
            Friends
          </h1>
          <p className="text-zinc-400 mt-1">Connect with other developers</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-zinc-800 pb-4">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-emerald-500/20 text-emerald-500"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}>
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-700 text-zinc-300"
                    }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {activeTab === "friends" && (
            <motion.div
              key="friends"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3">
              {friends.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">No friends yet</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Visit profiles to send friend requests
                  </p>
                </div>
              ) : (
                friends.map(friend => (
                  <FriendCard
                    key={friend.friendshipId}
                    friend={friend}
                    type="friend"
                    onUnfriend={() => handleUnfriend(friend.friendshipId)}
                    loading={actionLoading === friend.friendshipId}
                  />
                ))
              )}
            </motion.div>
          )}

          {activeTab === "requests" && (
            <motion.div
              key="requests"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6">
              {/* Pending Requests */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  Pending Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No pending requests</p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(request => (
                      <FriendCard
                        key={request.friendshipId}
                        friend={request}
                        type="pending"
                        onAccept={() => handleAccept(request.friendshipId)}
                        onDecline={() => handleDecline(request.friendshipId)}
                        loading={actionLoading === request.friendshipId}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Requests */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Sent Requests ({sentRequests.length})
                </h3>
                {sentRequests.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No sent requests</p>
                ) : (
                  <div className="space-y-3">
                    {sentRequests.map(request => (
                      <FriendCard
                        key={request.friendshipId}
                        friend={request}
                        type="sent"
                        onCancel={() => handleDecline(request.friendshipId)}
                        loading={actionLoading === request.friendshipId}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "activity" && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3">
              {activity.length === 0 ? (
                <div className="text-center py-12">
                  <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">No recent activity</p>
                  <p className="text-zinc-500 text-sm mt-1">
                    Add friends to see their activity
                  </p>
                </div>
              ) : (
                activity.map(item => <ActivityCard key={item.id} item={item} />)
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FriendCard({
  friend,
  type,
  onAccept,
  onDecline,
  onUnfriend,
  onCancel,
  loading,
}: {
  friend: Friend;
  type: "friend" | "pending" | "sent";
  onAccept?: () => void;
  onDecline?: () => void;
  onUnfriend?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center justify-between">
      <Link
        href={`/profile/${friend.user.username}`}
        className="flex items-center gap-3 flex-1 hover:opacity-80 transition-opacity">
        {friend.user.image ? (
          <Image
            src={friend.user.image}
            alt={friend.user.username}
            width={48}
            height={48}
            className="rounded-full"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-lg font-bold text-zinc-500">
              {friend.user.username[0].toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-medium text-white">
            {friend.user.name || friend.user.username}
          </p>
          <p className="text-sm text-zinc-400">@{friend.user.username}</p>
        </div>
        <div className="ml-auto mr-4 text-right">
          <p className="text-sm text-emerald-500">Lv. {friend.user.level}</p>
          <p className="text-xs text-zinc-500">
            {friend.user.xp.toLocaleString()} XP
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {type === "friend" && (
          <button
            onClick={onUnfriend}
            disabled={loading}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
            title="Unfriend">
            {loading ? (
              <div className="w-5 h-5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            ) : (
              <UserMinus className="w-5 h-5" />
            )}
          </button>
        )}

        {type === "pending" && (
          <>
            <button
              onClick={onAccept}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Accept
                </>
              )}
            </button>
            <button
              onClick={onDecline}
              disabled={loading}
              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
              title="Decline">
              <X className="w-5 h-5" />
            </button>
          </>
        )}

        {type === "sent" && (
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50 text-sm">
            {loading ? (
              <div className="w-4 h-4 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4" />
                Cancel
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function ActivityCard({ item }: { item: ActivityItem }) {
  const getIcon = () => {
    switch (item.type) {
      case "solved":
        return <Target className="w-5 h-5 text-emerald-500" />;
      case "achievement":
        return <Award className="w-5 h-5 text-amber-500" />;
      case "streak":
        return <Flame className="w-5 h-5 text-orange-500" />;
      case "level":
        return <Trophy className="w-5 h-5 text-purple-500" />;
      case "daily":
        return <Target className="w-5 h-5 text-blue-500" />;
      default:
        return <Activity className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getMessage = () => {
    switch (item.type) {
      case "solved":
        return (
          <>
            solved{" "}
            <Link
              href={`/problems/${item.data.problemSlug}`}
              className="text-emerald-500 hover:underline">
              {item.data.problemTitle}
            </Link>
          </>
        );
      case "achievement":
        return (
          <>unlocked &ldquo;{item.data.achievementName}&rdquo; achievement</>
        );
      case "streak":
        return <>reached a {item.data.streakDays}-day streak! 🔥</>;
      case "level":
        return <>leveled up to Level {item.data.level}!</>;
      case "daily":
        return (
          <>
            completed the daily challenge:{" "}
            <Link
              href={`/problems/${item.data.problemSlug}`}
              className="text-blue-500 hover:underline">
              {item.data.problemTitle}
            </Link>
          </>
        );
      default:
        return "did something";
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-start gap-3">
      <Link href={`/profile/${item.user.username}`}>
        {item.user.image ? (
          <Image
            src={item.user.image}
            alt={item.user.username}
            width={40}
            height={40}
            className="rounded-full"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <span className="text-sm font-bold text-zinc-500">
              {item.user.username[0].toUpperCase()}
            </span>
          </div>
        )}
      </Link>
      <div className="flex-1">
        <p className="text-zinc-300">
          <Link
            href={`/profile/${item.user.username}`}
            className="font-medium text-white hover:text-emerald-500">
            {item.user.name || item.user.username}
          </Link>{" "}
          {getMessage()}
        </p>
        <p className="text-xs text-zinc-500 mt-1">{timeAgo(item.createdAt)}</p>
      </div>
      <div className="flex-shrink-0">{getIcon()}</div>
    </div>
  );
}
