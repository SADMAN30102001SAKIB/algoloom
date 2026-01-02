import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe, getPlanFromPriceId } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error("No userId in checkout session metadata");
    return;
  }

  // Subscription is created via customer.subscription.created event
  // Just log for debugging
  console.log(`Checkout completed for user ${userId}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    // Try to find user by customer ID
    const customerId = subscription.customer as string;
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });
    if (!user) {
      console.error("No user found for subscription");
      return;
    }
    await updateSubscription(user.id, subscription);
  } else {
    await updateSubscription(userId, subscription);
  }
}

async function updateSubscription(
  userId: string,
  subscription: Stripe.Subscription,
) {
  const subscriptionItem = subscription.items.data[0];
  const priceId = subscriptionItem?.price.id;
  const plan = getPlanFromPriceId(priceId);

  const status = mapStripeStatus(subscription.status);

  // Get period dates from subscription item
  const currentPeriodStart = subscriptionItem?.current_period_start
    ? new Date(subscriptionItem.current_period_start * 1000)
    : new Date();
  const currentPeriodEnd = subscriptionItem?.current_period_end
    ? new Date(subscriptionItem.current_period_end * 1000)
    : new Date();

  await prisma.$transaction(async tx => {
    // Upsert subscription
    await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      update: {
        stripeSubscriptionId: subscription.id,
        stripePriceId: priceId,
        plan,
        status,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
    });

    // Update user's isPro status
    await tx.user.update({
      where: { id: userId },
      data: { isPro: status === "ACTIVE" || status === "TRIALING" },
    });
  });

  console.log(
    `Subscription ${subscription.id} updated for user ${userId}: ${status}`,
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error("No user found for deleted subscription");
    return;
  }

  await prisma.$transaction(async tx => {
    // Update subscription status
    await tx.subscription.updateMany({
      where: { stripeSubscriptionId: subscription.id },
      data: { status: "CANCELED" },
    });

    // Remove Pro status
    await tx.user.update({
      where: { id: user.id },
      data: { isPro: false },
    });
  });

  console.log(`Subscription ${subscription.id} deleted for user ${user.id}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // In Stripe SDK v20, subscription is in parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = subscriptionDetails?.subscription as
    | string
    | undefined;
  if (!subscriptionId) return;

  // Subscription updated event handles this
  console.log(`Payment succeeded for subscription ${subscriptionId}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // In Stripe SDK v20, subscription is in parent.subscription_details
  const subscriptionDetails = invoice.parent?.subscription_details;
  const subscriptionId = subscriptionDetails?.subscription as
    | string
    | undefined;
  if (!subscriptionId) return;

  const subscription = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });

  if (subscription) {
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: "PAST_DUE" },
    });
  }

  console.log(`Payment failed for subscription ${subscriptionId}`);
}

function mapStripeStatus(
  status: Stripe.Subscription.Status,
): "ACTIVE" | "CANCELED" | "PAST_DUE" | "UNPAID" | "TRIALING" | "INCOMPLETE" {
  switch (status) {
    case "active":
      return "ACTIVE";
    case "canceled":
      return "CANCELED";
    case "past_due":
      return "PAST_DUE";
    case "unpaid":
      return "UNPAID";
    case "trialing":
      return "TRIALING";
    case "incomplete":
    case "incomplete_expired":
      return "INCOMPLETE";
    default:
      return "INCOMPLETE";
  }
}
