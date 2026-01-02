"use client";

import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PremiumBadgeProps {
  plan?: "MONTHLY" | "YEARLY";
  size?: "sm" | "md";
  showTooltip?: boolean;
}

export function PremiumBadge({
  plan,
  size = "sm",
  showTooltip = true,
}: PremiumBadgeProps) {
  const planLabel = plan === "YEARLY" ? "PRO+" : "PRO";

  const badge = (
    <Badge
      className={`bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 ${
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      }`}>
      <Crown className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {size === "md" && <span className="ml-1">{planLabel}</span>}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  const tooltipText =
    plan === "YEARLY"
      ? "Premium Yearly Member"
      : plan === "MONTHLY"
        ? "Premium Monthly Member"
        : "Premium Member";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
