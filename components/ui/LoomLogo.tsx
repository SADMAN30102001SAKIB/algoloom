"use client";

import React from "react";

interface LoomLogoProps {
  className?: string;
  size?: number;
}

export function LoomLogo({ className = "", size = 24 }: LoomLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="loomGradientNav"
          x1="0"
          y1="0"
          x2="32"
          y2="32"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      <path
        d="M16 6L24 14L16 22L8 14L16 6Z"
        stroke="url(#loomGradientNav)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 10L20 18"
        stroke="url(#loomGradientNav)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M20 10L12 18"
        stroke="url(#loomGradientNav)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="16" cy="14" r="1.5" fill="white" />
    </svg>
  );
}
