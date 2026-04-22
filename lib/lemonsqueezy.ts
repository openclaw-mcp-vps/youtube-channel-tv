import crypto from "node:crypto";

import type { StripeWebhookEvent } from "@/lib/types";

function parseStripeSignature(signatureHeader: string) {
  const chunks = signatureHeader.split(",").map((part) => part.trim());
  let timestamp = "";
  const signatures: string[] = [];

  for (const chunk of chunks) {
    const [key, value] = chunk.split("=");

    if (!key || !value) {
      continue;
    }

    if (key === "t") {
      timestamp = value;
    }

    if (key === "v1") {
      signatures.push(value);
    }
  }

  return { timestamp, signatures };
}

export function verifyStripeWebhookSignature(params: {
  payload: string;
  signatureHeader: string | null;
  secret: string;
}) {
  const { payload, signatureHeader, secret } = params;

  if (!signatureHeader || !secret) {
    return false;
  }

  const { timestamp, signatures } = parseStripeSignature(signatureHeader);

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => {
    try {
      const a = Buffer.from(signature, "hex");
      const b = Buffer.from(expected, "hex");

      if (a.length !== b.length) {
        return false;
      }

      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  });
}

export function isSupportedPaidStripeEvent(eventType: string | undefined) {
  return (
    eventType === "checkout.session.completed" ||
    eventType === "invoice.payment_succeeded"
  );
}

export function extractCustomerEmailFromStripeEvent(event: StripeWebhookEvent) {
  const object = event.data?.object;

  if (!object) {
    return null;
  }

  const customerEmail =
    typeof object.customer_email === "string" ? object.customer_email : null;

  const customerDetails =
    typeof object.customer_details === "object" && object.customer_details
      ? (object.customer_details as Record<string, unknown>)
      : null;

  const nestedEmail =
    customerDetails && typeof customerDetails.email === "string"
      ? customerDetails.email
      : null;

  return (customerEmail ?? nestedEmail)?.trim().toLowerCase() ?? null;
}
