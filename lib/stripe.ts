import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
});

export const PLANS = {
  MONTHLY: {
    priceId: process.env.STRIPE_PRICE_MONTHLY!,
    name: "Monthly",
    price: 9.99,
    interval: "month" as const,
  },
  YEARLY: {
    priceId: process.env.STRIPE_PRICE_YEARLY!,
    name: "Yearly",
    price: 79.99,
    interval: "year" as const,
    savings: "33%",
  },
};

export function getPlanFromPriceId(priceId: string): "MONTHLY" | "YEARLY" {
  if (priceId === PLANS.MONTHLY.priceId) return "MONTHLY";
  if (priceId === PLANS.YEARLY.priceId) return "YEARLY";
  return "MONTHLY"; // fallback
}
