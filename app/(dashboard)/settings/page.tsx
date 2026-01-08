"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { 
  User, 
  Lock, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Globe,
  Github,
  Linkedin,
  MapPin,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/Spinner";

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    website: "",
    githubUrl: "",
    linkedinUrl: ""
  });

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      setInitialLoading(false);
      return;
    }

    if (status === "authenticated" && !hasFetched) {
      setHasFetched(true);
      // Fetch full profile data
      fetch(`/api/user/profile`)
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setProfileData({
              name: data.user.name || "",
              bio: data.user.bio || "",
              location: data.user.location || "",
              website: data.user.website || "",
              githubUrl: data.user.githubUrl || "",
              linkedinUrl: data.user.linkedinUrl || ""
            });
          }
          if (data.hasPassword !== undefined) {
            setHasPassword(data.hasPassword);
          }
        })
        .catch(err => console.error("Error fetching profile:", err))
        .finally(() => setInitialLoading(false));
    }
  }, [status, session?.user?.username, hasFetched]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      // Update local state with the saved data
      if (data.user) {
        setProfileData({
          name: data.user.name || "",
          bio: data.user.bio || "",
          location: data.user.location || "",
          website: data.user.website || "",
          githubUrl: data.user.githubUrl || "",
          linkedinUrl: data.user.linkedinUrl || ""
        });
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Update session if name changed
      if (data.user.name !== session?.user?.name) {
        await update({ name: data.user.name });
      }
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to update profile" });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      setMessage({ type: "success", text: "Password changed successfully!" });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to change password" });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-slate-400 mt-2">Manage your profile and security preferences.</p>
        </header>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Tabs */}
          <aside className="w-full md:w-64 flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "profile" 
                  ? "bg-slate-800 text-white border border-slate-700 shadow-lg" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === "security" 
                  ? "bg-slate-800 text-white border border-slate-700 shadow-lg" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>Security</span>
            </button>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 md:p-8">
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`flex items-center gap-3 p-4 mb-6 rounded-lg border ${
                  message.type === "success" 
                    ? "bg-green-500/10 border-green-500/50 text-green-400" 
                    : "bg-red-500/10 border-red-500/50 text-red-400"
                }`}
              >
                {message.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                <p className="text-sm font-medium">{message.text}</p>
              </motion.div>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-cyan-400" />
                    Profile Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-slate-300">Display Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                        placeholder="Your full name"
                        className="bg-slate-950 border-slate-800 focus:border-cyan-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location" className="text-slate-300">Location</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={e => setProfileData({...profileData, location: e.target.value})}
                          placeholder="City, Country"
                          className="bg-slate-950 border-slate-800 focus:border-cyan-500 pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-2">
                    <Label htmlFor="bio" className="text-slate-300">Bio</Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <textarea
                        id="bio"
                        rows={3}
                        value={profileData.bio}
                        onChange={e => setProfileData({...profileData, bio: e.target.value})}
                        placeholder="Tell us about yourself..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 pl-10 text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-purple-400" />
                    Online Presence
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-slate-300">Website</Label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="website"
                          value={profileData.website}
                          onChange={e => setProfileData({...profileData, website: e.target.value})}
                          placeholder="https://yourwebsite.com"
                          className="bg-slate-950 border-slate-800 focus:border-purple-500 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="github" className="text-slate-300">GitHub</Label>
                      <div className="relative">
                        <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="github"
                          value={profileData.githubUrl}
                          onChange={e => setProfileData({...profileData, githubUrl: e.target.value})}
                          placeholder="github.com/username"
                          className="bg-slate-950 border-slate-800 focus:border-purple-500 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin" className="text-slate-300">LinkedIn</Label>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                        <Input
                          id="linkedin"
                          value={profileData.linkedinUrl}
                          onChange={e => setProfileData({...profileData, linkedinUrl: e.target.value})}
                          placeholder="linkedin.com/in/username"
                          className="bg-slate-950 border-slate-800 focus:border-purple-500 pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-8 h-12 shadow-lg shadow-cyan-500/20"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                    Save Profile
                  </Button>
                </div>
              </form>
            )}

            {activeTab === "security" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-red-400" />
                    Password & Security
                  </h3>
                  
                  {!hasPassword ? (
                    <div className="p-8 bg-slate-950/50 border border-slate-800 rounded-xl text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto">
                        <User className="w-8 h-8 text-slate-500" />
                      </div>
                      <h4 className="text-lg font-medium text-white">OAuth Account</h4>
                      <p className="text-slate-400 max-w-sm mx-auto">
                        You are logged in via an external provider. Password management is handled by your provider directly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-2">
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            className="bg-slate-950 border-slate-800"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                            className="bg-slate-950 border-slate-800"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            className="bg-slate-950 border-slate-800"
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-6 flex justify-end">
                        <Button
                          type="submit"
                          disabled={loading}
                          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white px-8 h-12 shadow-lg shadow-red-500/20"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Lock className="w-5 h-5 mr-2" />}
                          Update Password
                        </Button>
                      </div>

                      <div className="mt-12 p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
                        <h4 className="text-sm font-semibold mb-2">Password Requirements:</h4>
                        <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
                          <li>Minimum 8 characters long</li>
                          <li>Must be different from your current password</li>
                          <li>Passwords must match Exactly</li>
                        </ul>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
