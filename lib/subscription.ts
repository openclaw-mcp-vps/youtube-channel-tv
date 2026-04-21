import { createHmac, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

import type { PurchaseRecord } from "@/types";

const ACCESS_COOKIE_NAME = "yt_tv_access";
const ACCESS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const DATA_DIR = path.join(process.cwd(), "data");
const PURCHASES_FILE = path.join(DATA_DIR, "purchases.json");

type CookieStoreLike = {
  get(name: string): { value: string } | undefined;
};

type PurchasesPayload = {
  purchases: PurchaseRecord[];
};

function getSigningSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "development-secret-change-me";
}

function getTokenHash(payload: string) {
  return createHmac("sha256", getSigningSecret()).update(payload).digest("hex");
}

async function ensurePurchasesFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(PURCHASES_FILE);
  } catch {
    const initial: PurchasesPayload = { purchases: [] };
    await fs.writeFile(PURCHASES_FILE, JSON.stringify(initial, null, 2), "utf8");
  }
}

async function readPurchases(): Promise<PurchasesPayload> {
  await ensurePurchasesFile();
  const raw = await fs.readFile(PURCHASES_FILE, "utf8");

  try {
    const parsed = JSON.parse(raw) as PurchasesPayload;
    return {
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : []
    };
  } catch {
    return { purchases: [] };
  }
}

async function writePurchases(payload: PurchasesPayload) {
  await ensurePurchasesFile();
  await fs.writeFile(PURCHASES_FILE, JSON.stringify(payload, null, 2), "utf8");
}

export function getAccessCookieName() {
  return ACCESS_COOKIE_NAME;
}

export function createAccessToken(email: string) {
  const normalized = email.trim().toLowerCase();
  const expiresAt = Date.now() + ACCESS_COOKIE_MAX_AGE_SECONDS * 1000;
  const tokenPayload = `${normalized}|${expiresAt}`;
  const signature = getTokenHash(tokenPayload);

  return Buffer.from(`${tokenPayload}|${signature}`, "utf8").toString("base64url");
}

export function verifyAccessToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [email, expiresAtRaw, signature] = decoded.split("|");

    if (!email || !expiresAtRaw || !signature) {
      return null;
    }

    const payload = `${email}|${expiresAtRaw}`;
    const expected = getTokenHash(payload);

    const valid = timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    if (!valid) {
      return null;
    }

    const expiresAt = Number.parseInt(expiresAtRaw, 10);
    if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
      return null;
    }

    return {
      email,
      expiresAt
    };
  } catch {
    return null;
  }
}

export function hasActiveAccess(cookieStore: CookieStoreLike, expectedEmail?: string) {
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return false;
  }

  if (!expectedEmail) {
    return true;
  }

  return payload.email === expectedEmail.trim().toLowerCase();
}

export async function hasPurchasedEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const { purchases } = await readPurchases();
  return purchases.some((purchase) => purchase.email === normalized);
}

export async function recordPurchase(email: string, stripeSessionId: string) {
  const normalized = email.trim().toLowerCase();
  const { purchases } = await readPurchases();

  const exists = purchases.some(
    (purchase) => purchase.stripeSessionId === stripeSessionId || purchase.email === normalized
  );

  if (exists) {
    return;
  }

  purchases.push({
    email: normalized,
    stripeSessionId,
    purchasedAt: new Date().toISOString()
  });

  await writePurchases({ purchases });
}

function safeCompareHex(left: string, right: string) {
  const leftBuf = Buffer.from(left);
  const rightBuf = Buffer.from(right);

  if (leftBuf.length !== rightBuf.length) {
    return false;
  }

  return timingSafeEqual(leftBuf, rightBuf);
}

export function verifyStripeWebhookSignature(payload: string, header: string | null) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !header) {
    return false;
  }

  const parts = header.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  const timestamp = parts.t;
  const signature = parts.v1;

  if (!timestamp || !signature) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  return safeCompareHex(signature, expected);
}

export function getAccessCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_COOKIE_MAX_AGE_SECONDS
  };
}
