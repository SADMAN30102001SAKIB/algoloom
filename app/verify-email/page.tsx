"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { update } = useSession();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const [hasVerified, setHasVerified] = useState(false);

  useEffect(() => {
    // Prevent double verification
    if (hasVerified) return;

    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setStatus("error");
      setMessage("Invalid verification link");
      return;
    }

    setHasVerified(true);

    // Verify the token
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email }),
    })
      .then(res => res.json())
      .then(async data => {
        if (data.success) {
          setStatus("success");
          setMessage("Email verified successfully! You can now sign in.");

          // Trigger session refresh to update emailVerified status
          await update?.();
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("An error occurred during verification");
      });
  }, [searchParams, update, hasVerified]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin" />
              <h1 className="text-2xl font-bold">Verifying your email...</h1>
              <p className="text-muted-foreground">Please wait a moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold text-green-500">
                Email Verified!
              </h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="pt-4">
                <Button
                  onClick={() => router.push("/login")}
                  className="w-full"
                  size="lg">
                  Sign In
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500" />
              <h1 className="text-2xl font-bold text-red-500">
                Verification Failed
              </h1>
              <p className="text-muted-foreground">{message}</p>
              <div className="pt-4 flex flex-col gap-3">
                <Link href="/register" className="w-full">
                  <Button variant="outline" className="w-full" size="lg">
                    Try Again
                  </Button>
                </Link>
                <Link href="/login" className="w-full">
                  <Button variant="ghost" className="w-full">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      }>
      <VerifyEmailContent />
    </Suspense>
  );
}
