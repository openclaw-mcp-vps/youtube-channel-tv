import { NextRequest, NextResponse } from "next/server";

import { recordPurchase, verifyStripeWebhookSignature } from "@/lib/subscription";

export const runtime = "nodejs";

type StripeWebhook = {
  type?: string;
  data?: {
    object?: {
      id?: string;
      customer_email?: string;
      customer_details?: {
        email?: string;
      };
    };
  };
};

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!verifyStripeWebhookSignature(payload, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: StripeWebhook;

  try {
    event = JSON.parse(payload) as StripeWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const sessionId = event.data?.object?.id;
    const email = event.data?.object?.customer_details?.email || event.data?.object?.customer_email;

    if (sessionId && email) {
      await recordPurchase(email, sessionId);
    }
  }

  return NextResponse.json({ received: true });
}
