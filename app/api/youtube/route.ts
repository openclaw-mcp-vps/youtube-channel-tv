import { NextRequest, NextResponse } from "next/server";
import { getAccessFromRequest } from "@/lib/auth";
import { getChannelsForEmail } from "@/lib/db";
import { buildContinuousLineup } from "@/lib/youtube";

function parseChannelsParam(raw: string | null) {
  if (!raw) {
    return [];
  }
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export async function GET(request: NextRequest) {
  const access = getAccessFromRequest(request);
  if (!access) {
    return NextResponse.json({ error: "Access is locked. Verify your purchase first." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const explicitChannelId = searchParams.get("channelId");
  const explicitChannels = parseChannelsParam(searchParams.get("channels"));

  let channelIds = explicitChannels;

  if (explicitChannelId) {
    channelIds = [explicitChannelId];
  }

  if (channelIds.length === 0) {
    const saved = await getChannelsForEmail(access.email);
    channelIds = saved.map((item) => item.channelId);
  }

  if (channelIds.length === 0) {
    return NextResponse.json(
      { error: "No channels available. Add at least one channel on your dashboard." },
      { status: 400 }
    );
  }

  try {
    const playlist = await buildContinuousLineup(channelIds, 10);
    return NextResponse.json({
      playlist,
      channelCount: channelIds.length,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load YouTube videos right now.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
