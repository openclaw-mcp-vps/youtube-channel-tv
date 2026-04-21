import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, auth, verifyAccessToken } from "@/lib/auth";
import { getLineup, saveLineup } from "@/lib/db";
import { getChannelsByIds } from "@/lib/youtube";

export const runtime = "nodejs";

const MAX_CHANNELS = 24;

function normalizeChannelIds(values: unknown): string[] {
  if (!Array.isArray(values)) return [];

  const ids = values
    .map((item) => String(item ?? "").trim())
    .filter((id) => id.length > 0)
    .filter((id) => id.startsWith("UC") || id.length > 12);

  return [...new Set(ids)].slice(0, MAX_CHANNELS);
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value, email);

  const channelIds = await getLineup(email);

  if (!channelIds.length) {
    return NextResponse.json({ channelIds: [], channels: [], hasAccess });
  }

  try {
    const channels = await getChannelsByIds(channelIds);
    const byId = new Map(channels.map((channel) => [channel.id, channel]));

    return NextResponse.json({
      channelIds,
      channels: channelIds.map((id) => byId.get(id)).filter(Boolean),
      hasAccess
    });
  } catch {
    return NextResponse.json({
      channelIds,
      channels: channelIds.map((id) => ({ id, title: `Channel ${id.slice(-6)}` })),
      hasAccess
    });
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value, email);
  if (!hasAccess) {
    return NextResponse.json(
      { error: "Purchase required. Unlock access from the dashboard after checkout." },
      { status: 402 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as { channelIds?: unknown };
  const channelIds = normalizeChannelIds(body.channelIds);

  if (!channelIds.length) {
    return NextResponse.json({ error: "Please provide at least one valid channel id." }, { status: 400 });
  }

  await saveLineup(email, channelIds);
  return NextResponse.json({ ok: true, channelIds });
}
