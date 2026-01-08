"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, Eye, Trash2 } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  username: string;
  role: string;
  xp: number;
  level: number;
  createdAt: Date;
  _count: {
    submissions: number;
    problemStats: number;
  };
}

interface UsersListClientProps {
  users: User[];
}

export default function UsersListClient({ users }: UsersListClientProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "xp" | "submissions">(
    "createdAt",
  );

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        user =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.username.toLowerCase().includes(query),
      );
    }

    // Filter by role
    if (roleFilter !== "ALL") {
      result = result.filter(user => user.role === roleFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "xp":
          return b.xp - a.xp;
        case "submissions":
          return b._count.submissions - a._count.submissions;
        case "createdAt":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return result;
  }, [users, searchQuery, roleFilter, sortBy]);

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    setDeleting(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.refresh();
      } else {
        alert("Failed to delete user");
      }
    } finally {
      setDeleting(null);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";

    if (!confirm(`Change role to ${newRole}?`)) return;

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });

    if (res.ok) {
      router.refresh();
    } else {
      alert("Failed to update role");
    }
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      ADMIN: "bg-red-500/20 text-red-400 border-red-500/50",
      USER: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    };
    return colors[role as keyof typeof colors] || colors.USER;
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <div className="text-slate-400">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filters:</span>
            </div>

            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search name, email, username..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="ALL">All Roles</option>
              <option value="USER">Users</option>
              <option value="ADMIN">Admins</option>
            </select>

            <select
              value={sortBy}
              onChange={e =>
                setSortBy(e.target.value as "createdAt" | "xp" | "submissions")
              }
              className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="createdAt">Sort by: Newest</option>
              <option value="xp">Sort by: XP</option>
              <option value="submissions">Sort by: Submissions</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Level / XP
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Activity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {user.name || "Unknown"}
                      </div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleRole(user.id, user.role)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors hover:opacity-80 ${getRoleBadge(
                        user.role,
                      )}`}>
                      {user.role}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">Level {user.level}</div>
                    <div className="text-xs text-slate-400">{user.xp} XP</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-white">
                      {user._count.submissions} submissions
                    </div>
                    <div className="text-xs text-slate-400">
                      {user._count.problemStats} problems solved
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/profile/${user.username}`}
                        className="p-2 text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800/50 transition"
                        title="View Profile">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(user.id)}
                        disabled={deleting === user.id}
                        className="p-2 text-red-400 hover:text-red-300 border border-slate-700 rounded-lg hover:bg-slate-800/50 transition disabled:opacity-50"
                        title="Delete User">
                        {deleting === user.id ? (
                          <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-slate-400">No users found</div>
        )}
      </div>
    </div>
  );
}
