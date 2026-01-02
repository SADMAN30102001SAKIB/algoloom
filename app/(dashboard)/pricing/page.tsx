"use client";

import { useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";

const plans = [
  {
    id: "MONTHLY",
    name: "Monthly",
    price: "$9.99",
    period: "/month",
    description: "Great for trying out premium features",
    features: [
      "Access all premium problems",
      "Unlimited AI hints",
      "No ads",
      "Priority support",
      "Early access to new features",
    ],
    popular: false,
  },
  {
    id: "YEARLY",
    name: "Yearly",
    price: "$79.99",
    period: "/year",
    description: "Best value - save 33%",
    features: [
      "Everything in Monthly",
      "Save 33% annually",
      "Exclusive yearly badge",
      "Contest early access",
      "Premium Discord role",
    ],
    popular: true,
    savings: "Save $40/year",
  },
];

const freeFeatures = [
  "Access to free problems",
  "5 AI hints per day",
  "Basic statistics",
  "Public leaderboard",
  "Community discussions",
];

function PricingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const canceled = searchParams.get("canceled");

  const handleSubscribe = async (plan: string) => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    if (!session?.user?.emailVerified) {
      toast.error("Please verify your email first");
      return;
    }

    setLoadingPlan(plan);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start checkout");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {canceled && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
            <p className="text-yellow-400">
              Checkout was canceled. You can try again when you&apos;re ready.
            </p>
          </div>
        )}

        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-500 to-pink-500">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium Plans
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-white">
            Unlock Your Full Potential
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Get access to premium problems, unlimited AI hints, and exclusive
            features to accelerate your coding journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Free Plan */}
          <Card className="relative border-slate-700 bg-slate-900 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="w-5 h-5 text-blue-400" />
                Free
              </CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-white">$0</span>
                <span className="text-slate-400">/forever</span>
              </div>
              <CardDescription className="text-slate-400">
                Perfect for getting started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {freeFeatures.map(feature => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-auto">
              <Button
                variant="outline"
                className="w-full border-slate-600 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
                onClick={() => router.push("/problems")}>
                Start for Free
              </Button>
            </CardFooter>
          </Card>

          {/* Paid Plans */}
          {plans.map(plan => (
            <Card
              key={plan.id}
              className={`relative bg-slate-900 flex flex-col ${
                plan.popular ? "border-purple-500" : "border-slate-700"
              }`}>
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className={plan.popular ? "pt-8" : ""}>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Crown
                    className={`w-5 h-5 ${
                      plan.popular ? "text-purple-400" : "text-yellow-400"
                    }`}
                  />
                  {plan.name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-slate-400">{plan.period}</span>
                </div>
                <CardDescription className="text-slate-400">
                  {plan.description}
                </CardDescription>
                {plan.savings && (
                  <Badge
                    variant="secondary"
                    className="mt-2 bg-green-500/20 text-green-400">
                    {plan.savings}
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="mt-auto">
                <Button
                  className={`w-full ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      : ""
                  }`}
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingPlan !== null}>
                  {loadingPlan === plan.id ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Subscribe to {plan.name}</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6 text-white">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2 text-white">
                Can I cancel my subscription?
              </h3>
              <p className="text-sm text-slate-400">
                Yes! You can cancel anytime from your billing settings.
                You&apos;ll continue to have access until the end of your
                billing period.
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2 text-white">
                What payment methods do you accept?
              </h3>
              <p className="text-sm text-slate-400">
                We accept all major credit cards through Stripe, including Visa,
                Mastercard, and American Express.
              </p>
            </div>
            <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
              <h3 className="font-semibold mb-2 text-white">
                Can I switch between plans?
              </h3>
              <p className="text-sm text-slate-400">
                Yes, you can upgrade or downgrade at any time. Changes will be
                prorated automatically.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }>
      <PricingContent />
    </Suspense>
  );
}
