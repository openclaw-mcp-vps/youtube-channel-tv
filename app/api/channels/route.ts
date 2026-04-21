import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getLineupByEmail, saveLineupByEmail } from "@/lib/storage";
import { hasActiveAccess } from "@/lib/subscription";
import type { YouTubeChannel } from "@/types";

export const runtime = "nodejs";

function isVideoPayload(value: unknown) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.url === "string" &&
    typeof record.channelId === "string"
  );
}

function isChannelPayload(value: unknown): value is YouTubeChannel {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    typeof record.description === "string" &&
    typeof record.thumbnailUrl === "string" &&
    typeof record.uploadsPlaylistId === "string" &&
    Array.isArray(record.videos) &&
    record.videos.every(isVideoPayload)
  );
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasActiveAccess(request.cookies, email)) {
    return NextResponse.json({ error: "Subscription required." }, { status: 402 });
  }

  const lineup = await getLineupByEmail(email);
  return NextResponse.json(lineup);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!hasActiveAccess(request.cookies, email)) {
    return NextResponse.json({ error: "Subscription required." }, { status: 402 });
  }

  const body = (await request.json()) as { channels?: unknown };
  const channels = Array.isArray(body.channels) ? body.channels : null;

  if (!channels || !channels.every(isChannelPayload)) {
    return NextResponse.json({ error: "Invalid channel payload." }, { status: 400 });
  }

  const lineup = await saveLineupByEmail(email, channels);
  return NextResponse.json(lineup);
}
