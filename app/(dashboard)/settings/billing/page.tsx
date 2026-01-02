"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Crown,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

interface Subscription {
  id: string;
  plan: "MONTHLY" | "YEARLY";
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

function BillingContent() {
  const { status: authStatus, update: updateSession } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  const success = searchParams.get("success");

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?callbackUrl=/settings/billing");
      return;
    }

    if (authStatus === "authenticated") {
      fetchSubscription();
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (success) {
      toast.success("Subscription activated successfully!");
      // Refresh session to update Pro status in JWT
      updateSession();
      // Clear the query param
      router.replace("/settings/billing");
    }
  }, [success, router, updateSession]);

  const fetchSubscription = async () => {
    try {
      const response = await fetch("/api/user/subscription");
      const data = await response.json();
      setSubscription(data.subscription);
      setIsPro(data.isPro);
    } catch (error) {
      console.error("Failed to fetch subscription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to open billing portal");
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setPortalLoading(false);
    }
  };

  if (authStatus === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        </main>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400",
    TRIALING: "bg-blue-500/20 text-blue-400",
    PAST_DUE: "bg-yellow-500/20 text-yellow-400",
    CANCELED: "bg-red-500/20 text-red-400",
    UNPAID: "bg-red-500/20 text-red-400",
    INCOMPLETE: "bg-gray-500/20 text-gray-400",
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white">
            Billing & Subscription
          </h1>
          <p className="text-slate-400">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-6 bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Crown className="w-5 h-5 text-yellow-400" />
              Current Plan
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your current subscription status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription && isPro ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      AlgoLoom Premium ({subscription.plan})
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={statusColors[subscription.status]}>
                        {subscription.status === "ACTIVE" && (
                          <CheckCircle className="w-3 h-3 mr-1" />
                        )}
                        {subscription.status === "PAST_DUE" && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {subscription.status}
                      </Badge>
                      {subscription.cancelAtPeriodEnd && (
                        <Badge
                          variant="outline"
                          className="text-yellow-400 border-yellow-400/50">
                          Cancels at period end
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      {subscription.plan === "MONTHLY" ? "$9.99" : "$79.99"}
                    </p>
                    <p className="text-sm text-slate-400">
                      per {subscription.plan === "MONTHLY" ? "month" : "year"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {subscription.cancelAtPeriodEnd
                        ? "Access ends"
                        : "Next billing date"}
                      :{" "}
                      <span className="text-white">
                        {format(
                          new Date(subscription.currentPeriodEnd),
                          "MMMM d, yyyy",
                        )}
                      </span>
                      <span className="text-slate-400 ml-1">
                        (
                        {formatDistanceToNow(
                          new Date(subscription.currentPeriodEnd),
                          { addSuffix: true },
                        )}
                        )
                      </span>
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="w-full sm:w-auto">
                  {portalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Subscription
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Free Plan
                    </h3>
                    <p className="text-sm text-slate-400">
                      Upgrade to unlock premium features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">$0</p>
                    <p className="text-sm text-slate-400">forever</p>
                  </div>
                </div>

                <Button
                  onClick={() => router.push("/pricing")}
                  className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Benefits */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Premium Benefits</CardTitle>
            <CardDescription className="text-slate-400">
              What you get with AlgoLoom Premium
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {[
                "Access all premium problems",
                "Unlimited AI hints",
                "No advertisements",
                "Priority support",
                "Early access to new features",
                "Exclusive premium badge",
                "Contest early access",
                "Premium Discord role",
              ].map(benefit => (
                <li key={benefit} className="flex items-center gap-2">
                  <CheckCircle
                    className={`w-4 h-4 ${
                      isPro ? "text-green-500" : "text-slate-500"
                    }`}
                  />
                  <span className={isPro ? "text-white" : "text-slate-400"}>
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }>
      <BillingContent />
    </Suspense>
  );
}
