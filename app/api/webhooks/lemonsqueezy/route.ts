import { NextRequest, NextResponse } from "next/server";

import { addPurchase } from "@/lib/db";
import {
  extractCustomerEmailFromStripeEvent,
  isSupportedPaidStripeEvent,
  verifyStripeWebhookSignature
} from "@/lib/lemonsqueezy";
import type { StripeWebhookEvent } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured." },
      { status: 500 }
    );
  }

  const payload = await request.text();
  const signatureHeader = request.headers.get("stripe-signature");

  const verified = verifyStripeWebhookSignature({
    payload,
    signatureHeader,
    secret
  });

  if (!verified) {
    return NextResponse.json({ error: "Invalid Stripe signature." }, { status: 400 });
  }

  let event: StripeWebhookEvent;

  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid webhook payload." }, { status: 400 });
  }

  if (!isSupportedPaidStripeEvent(event.type)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const email = extractCustomerEmailFromStripeEvent(event);

  if (!email) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const object = event.data?.object as Record<string, unknown> | undefined;
  const amountTotal =
    typeof object?.amount_total === "number" ? object.amount_total : undefined;
  const currency =
    typeof object?.currency === "string" ? object.currency : undefined;

  await addPurchase({
    email,
    provider: "stripe",
    purchasedAt: new Date().toISOString(),
    eventId: event.id,
    amountTotal,
    currency
  });

  return NextResponse.json({ received: true });
}
