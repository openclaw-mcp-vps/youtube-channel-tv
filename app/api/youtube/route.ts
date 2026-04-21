import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, auth, verifyAccessToken } from "@/lib/auth";
import { getLineup } from "@/lib/db";
import { buildContinuousQueue, searchChannels } from "@/lib/youtube";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const action = request.nextUrl.searchParams.get("action");

  if (action === "search-channels") {
    const hasAccess = verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value, email);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unlock required before channel search." }, { status: 402 });
    }

    const query = request.nextUrl.searchParams.get("q") ?? "";

    try {
      const channels = await searchChannels(query);
      return NextResponse.json({ channels });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "YouTube search failed. Verify YOUTUBE_API_KEY configuration."
        },
        { status: 500 }
      );
    }
  }

  if (action === "build-queue") {
    const hasAccess = verifyAccessToken(request.cookies.get(ACCESS_COOKIE_NAME)?.value, email);
    if (!hasAccess) {
      return NextResponse.json({ error: "Unlock required before watching TV mode." }, { status: 402 });
    }

    const channelIdsParam = request.nextUrl.searchParams.get("channelIds") ?? "";
    const perChannelParam = Number(request.nextUrl.searchParams.get("perChannel") ?? "12");

    const requestedChannelIds = channelIdsParam
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const channelIds = requestedChannelIds.length > 0 ? requestedChannelIds : await getLineup(email);

    if (!channelIds.length) {
      return NextResponse.json({ queue: [] });
    }

    try {
      const queue = await buildContinuousQueue(channelIds, Number.isNaN(perChannelParam) ? 12 : perChannelParam);
      return NextResponse.json({ queue });
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Queue build failed. Verify YOUTUBE_API_KEY configuration."
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      error: "Invalid action. Use action=search-channels or action=build-queue"
    },
    { status: 400 }
  );
}
