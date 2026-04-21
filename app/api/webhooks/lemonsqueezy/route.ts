import { NextRequest, NextResponse } from "next/server";
import { addStripePurchase } from "@/lib/database";
import { lemonsqueezyMigrationMessage } from "@/lib/lemonsqueezy";
import { extractCheckoutEmail, parseStripeEvent, verifyStripeWebhookSignature } from "@/lib/stripe";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ message: lemonsqueezyMigrationMessage() });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawPayload = await request.text();

  if (!verifyStripeWebhookSignature(rawPayload, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = parseStripeEvent(rawPayload);

  if (event.type === "checkout.session.completed") {
    const email = extractCheckoutEmail(event);

    if (email) {
      await addStripePurchase(email, event.id);
    }
  }

  return NextResponse.json({ received: true });
}
