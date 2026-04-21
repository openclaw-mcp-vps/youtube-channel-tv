import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  createAccessToken,
  getAccessCookieName,
  getAccessCookieOptions,
  hasPurchasedEmail
} from "@/lib/subscription";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  const sessionEmail = session?.user?.email;

  if (!sessionEmail) {
    return NextResponse.json({ error: "You must sign in first." }, { status: 401 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  if (email !== sessionEmail.trim().toLowerCase()) {
    return NextResponse.json(
      { error: "Use the same signed-in email address to claim access." },
      { status: 403 }
    );
  }

  const purchased = await hasPurchasedEmail(email);
  if (!purchased) {
    return NextResponse.json(
      { error: "No completed Stripe purchase found for that email yet." },
      { status: 404 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getAccessCookieName(), createAccessToken(email), getAccessCookieOptions());

  return response;
}
