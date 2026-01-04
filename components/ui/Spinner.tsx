"use client";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 border-2 border-slate-700 rounded-full"></div>
      <div className="absolute inset-0 border-2 border-transparent border-t-cyan-500 border-r-purple-500 rounded-full animate-spin"></div>
    </div>
  );
}
