"use client";

interface PageLoaderProps {
  message?: string;
  subtitle?: string;
}

export function PageLoader({
  message = "Loading...",
  subtitle,
}: PageLoaderProps) {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 border-r-purple-500 rounded-full animate-spin"></div>
        </div>
        <div className="text-white text-xl font-medium">{message}</div>
        {subtitle && (
          <div className="text-slate-500 text-sm mt-2">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
