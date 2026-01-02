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
  const { status: authStatus } = useSession();
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
      // Clear the query param
      router.replace("/settings/billing");
    }
  }, [success, router]);

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
      <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        </main>
      </>
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
    <>
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Billing & Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing information
          </p>
        </div>

        {/* Current Plan Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              Current Plan
            </CardTitle>
            <CardDescription>Your current subscription status</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription && isPro ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">
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
                        <Badge variant="outline" className="text-yellow-400">
                          Cancels at period end
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {subscription.plan === "MONTHLY" ? "$9.99" : "$79.99"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      per {subscription.plan === "MONTHLY" ? "month" : "year"}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {subscription.cancelAtPeriodEnd
                        ? "Access ends"
                        : "Next billing date"}
                      :{" "}
                      <span className="text-foreground">
                        {format(
                          new Date(subscription.currentPeriodEnd),
                          "MMMM d, yyyy",
                        )}
                      </span>
                      <span className="text-muted-foreground ml-1">
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
                    <h3 className="text-xl font-semibold">Free Plan</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to unlock premium features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">$0</p>
                    <p className="text-sm text-muted-foreground">forever</p>
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
        <Card>
          <CardHeader>
            <CardTitle>Premium Benefits</CardTitle>
            <CardDescription>
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
                      isPro ? "text-green-500" : "text-muted-foreground"
                    }`}
                  />
                  <span className={isPro ? "" : "text-muted-foreground"}>
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }>
      <BillingContent />
    </Suspense>
  );
}
