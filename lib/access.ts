import { createHmac, timingSafeEqual } from "node:crypto";

export const ACCESS_COOKIE_NAME = "yttv_access";
const ACCESS_TTL_DAYS = 30;

interface AccessPayload {
  email: string;
  exp: number;
}

function getSigningSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? "local-dev-secret";
}

function encode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function decode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("base64url");
}

export function issueAccessToken(email: string): string {
  const payload: AccessPayload = {
    email: email.toLowerCase().trim(),
    exp: Math.floor(Date.now() / 1000) + ACCESS_TTL_DAYS * 24 * 60 * 60
  };

  const encodedPayload = encode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyAccessToken(token: string): AccessPayload | null {
  const parts = token.split(".");

  if (parts.length !== 2) {
    return null;
  }

  const [encodedPayload, providedSignature] = parts;
  const expectedSignature = signPayload(encodedPayload);

  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    providedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(providedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(decode(encodedPayload)) as AccessPayload;

    if (!payload.email || typeof payload.exp !== "number") {
      return null;
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
