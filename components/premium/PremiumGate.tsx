"use client";

import { ReactNode } from "react";
import { useSession } from "next-auth/react";
import { Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PremiumGateProps {
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function PremiumGate({
  children,
  fallback,
  showUpgradePrompt = true,
}: PremiumGateProps) {
  const { data: session } = useSession();
  const isPro = session?.user?.isPro;

  if (isPro) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showUpgradePrompt) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
      <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
        <Lock className="w-8 h-8 text-purple-400" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Premium Content</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        This content is available exclusively to AlgoLoom Premium members.
        Upgrade now to unlock all premium features.
      </p>
      <Link href="/pricing">
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to Premium
        </Button>
      </Link>
    </div>
  );
}

interface PremiumLockProps {
  isPremium?: boolean;
  children: ReactNode;
}

export function PremiumLock({ isPremium, children }: PremiumLockProps) {
  const { data: session } = useSession();
  const userIsPro = session?.user?.isPro;

  // If content is not premium, or user is pro, show content
  if (!isPremium || userIsPro) {
    return <>{children}</>;
  }

  // Content is premium but user is not pro
  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/50">
        <Link href="/pricing">
          <Button
            variant="outline"
            className="border-purple-500/50 hover:bg-purple-500/10">
            <Lock className="w-4 h-4 mr-2" />
            Unlock with Premium
          </Button>
        </Link>
      </div>
    </div>
  );
}
