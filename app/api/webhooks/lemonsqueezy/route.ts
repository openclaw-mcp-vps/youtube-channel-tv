import { createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { markPurchase } from "@/lib/db";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: {
      customer_email?: string | null;
      customer_details?: {
        email?: string | null;
      };
    };
  };
};

function safeCompareSignature(a: string, b: string) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function verifyStripeSignature(rawBody: string, signatureHeader: string, secret: string) {
  const fields = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, pair) => {
    const [key, value] = pair.split("=");
    if (!key || !value) return acc;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(value);
    return acc;
  }, {});

  const timestamp = fields.t?.[0];
  const signatures = fields.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const payload = `${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");

  return signatures.some((signature) => safeCompareSignature(signature, expected));
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");

  if (!webhookSecret || !signature) {
    return NextResponse.json({ error: "Missing webhook signature or secret." }, { status: 400 });
  }

  const rawBody = await request.text();

  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let event: StripeEvent;

  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const email = event.data.object.customer_details?.email ?? event.data.object.customer_email ?? "";

    if (email) {
      await markPurchase({
        email,
        provider: "stripe",
        eventId: event.id
      });
    }
  }

  return NextResponse.json({ received: true });
}
