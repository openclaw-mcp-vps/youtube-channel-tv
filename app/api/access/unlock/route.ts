import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, issueAccessToken } from "@/lib/access";
import { hasActivePurchase } from "@/lib/database";

interface UnlockPayload {
  email?: string;
  nextPath?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = (await request.json()) as UnlockPayload;
  const email = payload.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Checkout email is required." }, { status: 400 });
  }

  const purchased = await hasActivePurchase(email);

  if (!purchased) {
    return NextResponse.json(
      {
        error:
          "No completed Stripe purchase found for this email yet. If you just paid, wait a few seconds and try again."
      },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    nextPath: payload.nextPath && payload.nextPath.startsWith("/") ? payload.nextPath : "/dashboard"
  });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: issueAccessToken(email),
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
