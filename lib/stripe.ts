import { createHmac, timingSafeEqual } from "node:crypto";

interface StripeLikeEvent<T = unknown> {
  id: string;
  type: string;
  data: {
    object: T;
  };
}

interface CheckoutCompletedObject {
  customer_details?: {
    email?: string | null;
  };
  customer_email?: string | null;
}

export function verifyStripeWebhookSignature(payload: string, signatureHeader: string): boolean {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secret) {
    return false;
  }

  const signatureParts = signatureHeader.split(",").reduce<Record<string, string[]>>((acc, part) => {
    const [key, value] = part.split("=");

    if (!key || !value) {
      return acc;
    }

    acc[key] = acc[key] ? [...acc[key], value] : [value];
    return acc;
  }, {});

  const timestamp = signatureParts.t?.[0];
  const signatures = signatureParts.v1 ?? [];

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  return signatures.some((signature) => {
    const expectedBuffer = Buffer.from(expected);
    const providedBuffer = Buffer.from(signature);

    if (expectedBuffer.length !== providedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, providedBuffer);
  });
}

export function parseStripeEvent(payload: string): StripeLikeEvent<CheckoutCompletedObject> {
  return JSON.parse(payload) as StripeLikeEvent<CheckoutCompletedObject>;
}

export function extractCheckoutEmail(event: StripeLikeEvent<CheckoutCompletedObject>): string | null {
  const checkoutObject = event.data.object;

  return (
    checkoutObject.customer_details?.email?.toLowerCase().trim() ??
    checkoutObject.customer_email?.toLowerCase().trim() ??
    null
  );
}
