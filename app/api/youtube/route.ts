import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { hasActiveAccess } from "@/lib/subscription";
import { getChannelWithVideos } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "You must sign in first." }, { status: 401 });
  }

  if (!hasActiveAccess(request.cookies, email)) {
    return NextResponse.json({ error: "Subscription required." }, { status: 402 });
  }

  const input = request.nextUrl.searchParams.get("input")?.trim();

  if (!input) {
    return NextResponse.json({ error: "Missing input query parameter." }, { status: 400 });
  }

  try {
    const channel = await getChannelWithVideos(input);
    return NextResponse.json({ channel });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch channel from YouTube.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
