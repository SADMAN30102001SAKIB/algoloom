import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authEdge } from "@/lib/auth.edge";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis/cloudflare";

// Initialize Upstash Redis for distributed rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "",
});

// Create rate limiters for different endpoints
const rateLimiters = {
  // Default: 100 requests per minute
  default: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
    prefix: "ratelimit:default",
  }),
  // Submissions: 1 per minute
  submission: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1, "1 m"),
    analytics: true,
    prefix: "ratelimit:submission",
  }),
  // Hints: 5 per minute
  hints: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
    prefix: "ratelimit:hints",
  }),
  // Problems: 1000 per minute
  problems: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(1000, "1 m"),
    analytics: true,
    prefix: "ratelimit:problems",
  }),
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // API rate limiting with Upstash Redis
  if (pathname.startsWith("/api/")) {
    // Get IP from headers (Next.js 15 removed request.ip)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const identifier =
      forwardedFor?.split(",")[0]?.trim() || realIp || "anonymous";

    // Select appropriate rate limiter based on endpoint
    let ratelimiter = rateLimiters.default;

    if (pathname.startsWith("/api/submit-stream")) {
      ratelimiter = rateLimiters.submission;
    } else if (pathname.startsWith("/api/hints")) {
      ratelimiter = rateLimiters.hints;
    } else if (pathname.startsWith("/api/problems")) {
      ratelimiter = rateLimiters.problems;
    }

    // Check rate limit (distributed across all edge instances)
    const { success, limit, reset, remaining } =
      await ratelimiter.limit(identifier);

    if (!success) {
      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          limit,
          remaining,
          reset: new Date(reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            ...Object.fromEntries(response.headers),
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          },
        },
      );
    }

    // Add rate limit headers to successful responses
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", reset.toString());
  }

  // Admin routes - require authentication and ADMIN role
  const adminPaths = ["/admin"];
  const isAdminPath = adminPaths.some(path => pathname.startsWith(path));

  if (isAdminPath) {
    const session = await authEdge();

    // Debug: log session info
    console.log("[Middleware] Admin route check:", {
      pathname,
      hasSession: !!session,
      hasUser: !!session?.user,
      userRole: session?.user?.role,
      userEmail: session?.user?.email,
    });

    if (!session?.user) {
      const signInUrl = new URL("/login", request.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    if (session.user.role !== "ADMIN") {
      // Non-admin trying to access admin page - redirect to problems, not login
      return NextResponse.redirect(new URL("/problems", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
