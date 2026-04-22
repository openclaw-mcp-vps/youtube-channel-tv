import { NextRequest, NextResponse } from "next/server";

import { fetchChannelProfile, fetchChannelVideos, resolveChannelId } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const channelInput = request.nextUrl.searchParams.get("channel")?.trim();

  if (!channelInput) {
    return NextResponse.json(
      {
        error: "Missing channel query parameter."
      },
      { status: 400 }
    );
  }

  try {
    const channelId = resolveChannelId(channelInput);
    const [channel, videos] = await Promise.all([
      fetchChannelProfile(channelId),
      fetchChannelVideos(channelId, 25)
    ]);

    return NextResponse.json({ channel, videos });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch YouTube channel right now.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
