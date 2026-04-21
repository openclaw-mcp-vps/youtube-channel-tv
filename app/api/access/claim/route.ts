import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, auth, createAccessToken } from "@/lib/auth";
import { hasPurchase } from "@/lib/db";
import { normalizeEmail } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await auth();
  const userEmail = session?.user?.email;

  if (!userEmail) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { email?: string };
  const claimedEmail = normalizeEmail(String(body.email ?? ""));

  if (!claimedEmail) {
    return NextResponse.json({ error: "Please provide your checkout email." }, { status: 400 });
  }

  if (normalizeEmail(userEmail) !== claimedEmail) {
    return NextResponse.json(
      {
        error: "Email mismatch. Sign in with the same email you used during Stripe checkout."
      },
      { status: 403 }
    );
  }

  const purchased = await hasPurchase(claimedEmail);
  if (!purchased) {
    return NextResponse.json(
      {
        error: "No completed purchase found yet. Wait a moment and retry after Stripe webhook delivery."
      },
      { status: 404 }
    );
  }

  const response = NextResponse.json({
    ok: true,
    message: "Access unlocked. You can now use Dashboard and TV mode."
  });

  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: createAccessToken(claimedEmail),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
