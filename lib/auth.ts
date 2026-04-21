import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export const ACCESS_COOKIE_NAME = "yt_tv_access";
const ACCESS_DURATION_SECONDS = 60 * 60 * 24 * 30;

type AccessClaims = {
  email: string;
  iat: number;
  exp: number;
};

function getSecret() {
  return process.env.ACCESS_COOKIE_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-cookie-secret-change-me";
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payloadBase64: string) {
  return createHmac("sha256", getSecret()).update(payloadBase64).digest("base64url");
}

function safeCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

export function createAccessToken(email: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: AccessClaims = {
    email: email.trim().toLowerCase(),
    iat: now,
    exp: now + ACCESS_DURATION_SECONDS
  };

  const payloadBase64 = encodeBase64Url(JSON.stringify(payload));
  const signature = sign(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifyAccessToken(token?: string | null): AccessClaims | null {
  if (!token) {
    return null;
  }

  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadBase64);
  if (!safeCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(payloadBase64)) as AccessClaims;
    if (!payload.email || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function getAccessFromRequest(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE_NAME)?.value;
  return verifyAccessToken(token);
}

export async function getAccessFromServerCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  return verifyAccessToken(token);
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ACCESS_DURATION_SECONDS
  };
}

export function setAccessCookie(response: NextResponse, email: string) {
  response.cookies.set(ACCESS_COOKIE_NAME, createAccessToken(email), cookieOptions());
}

export function clearAccessCookie(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0
  });
}
