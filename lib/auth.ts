import type { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { normalizeUserKey } from "@/lib/db";

export const ACCESS_COOKIE_NAME = "yttv_access";
export const CUSTOMER_COOKIE_NAME = "yttv_customer";
const ACCESS_COOKIE_VALUE = "active";

function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

async function getClerkUserIdSafely() {
  if (!isClerkConfigured()) {
    return null;
  }

  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    return authResult.userId ?? null;
  } catch {
    return null;
  }
}

export async function getViewerIdentity() {
  const cookieStore = await cookies();
  const paidCustomer = cookieStore.get(CUSTOMER_COOKIE_NAME)?.value;

  if (paidCustomer) {
    return {
      userKey: normalizeUserKey(paidCustomer),
      source: "purchase" as const,
      label: paidCustomer
    };
  }

  const clerkUserId = await getClerkUserIdSafely();

  if (clerkUserId) {
    return {
      userKey: normalizeUserKey(`clerk:${clerkUserId}`),
      source: "clerk" as const,
      label: `Clerk user ${clerkUserId.slice(0, 8)}`
    };
  }

  return {
    userKey: null,
    source: "guest" as const,
    label: "Guest"
  };
}

export async function hasPaidAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;
}

export function requestHasPaidAccess(request: NextRequest) {
  return request.cookies.get(ACCESS_COOKIE_NAME)?.value === ACCESS_COOKIE_VALUE;
}

export function getViewerKeyFromRequest(request: NextRequest) {
  const paidCustomer = request.cookies.get(CUSTOMER_COOKIE_NAME)?.value;

  if (paidCustomer) {
    return normalizeUserKey(paidCustomer);
  }

  return null;
}

export function setPaidAccessCookies(response: NextResponse, email: string) {
  const normalized = email.trim().toLowerCase();

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: ACCESS_COOKIE_VALUE,
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });

  response.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: normalized,
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/"
  });
}
