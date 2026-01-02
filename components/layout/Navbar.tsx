"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  CreditCard,
  Crown,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PremiumBadge } from "@/components/premium/PremiumBadge";

const navLinks = [
  { href: "/problems", label: "Problems" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/submissions", label: "Submissions" },
  { href: "/friends", label: "Friends" },
];

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent hover:from-cyan-300 hover:to-purple-300 transition-all">
            AlgoLoom
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition font-medium ${
                  isActive(link.href)
                    ? "text-white"
                    : "text-slate-300 hover:text-white"
                }`}>
                {link.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className={`transition font-medium flex items-center gap-1 ${
                isActive("/pricing")
                  ? "text-purple-400"
                  : "text-purple-400/80 hover:text-purple-400"
              }`}>
              <Crown className="w-4 h-4" />
              Premium
            </Link>
          </nav>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
          ) : session?.user ? (
            <>
              {/* Premium Badge */}
              {session.user.isPro && <PremiumBadge size="md" />}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={session.user.image || undefined}
                        alt={session.user.name || "User"}
                      />
                      <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-purple-500">
                        {session.user.name?.[0]?.toUpperCase() ||
                          session.user.email?.[0]?.toUpperCase() ||
                          "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/profile/${session.user.username}`}
                      className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/billing" className="cursor-pointer">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  {session.user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="cursor-pointer text-red-400 focus:text-red-400">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <nav className="md:hidden border-t border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-2">
            {navLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className={`py-2 px-4 rounded-lg transition ${
                  isActive(link.href)
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="py-2 px-4 rounded-lg text-purple-400 hover:bg-slate-800 flex items-center gap-2"
              onClick={() => setMobileMenuOpen(false)}>
              <Crown className="w-4 h-4" />
              Premium
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
