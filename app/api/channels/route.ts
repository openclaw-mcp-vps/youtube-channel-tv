import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createChannel, listChannels } from "@/lib/database";
import { getRequestViewerEmail } from "@/lib/paywall";
import { fetchYouTubeMetadata } from "@/lib/youtube";

interface CreateChannelPayload {
  name?: string;
  description?: string;
  theme?: string;
  logoUrl?: string;
  lineup?: string;
  breakEvery?: number;
  breakDurationSec?: number;
}

function parseDuration(line: string): { url: string; durationSec: number } {
  const [urlPart, durationPart] = line.split("|").map((part) => part.trim());

  if (!urlPart) {
    throw new Error("Each lineup row requires a YouTube URL.");
  }

  if (!durationPart) {
    return { url: urlPart, durationSec: 600 };
  }

  const numeric = Number(durationPart);

  if (Number.isNaN(numeric) || numeric <= 0) {
    throw new Error(`Invalid duration value in lineup row: ${line}`);
  }

  return { url: urlPart, durationSec: Math.round(numeric * 60) };
}

export async function GET(): Promise<NextResponse> {
  const channels = await listChannels();
  return NextResponse.json({ channels });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const viewerEmail = getRequestViewerEmail(request);

  if (!viewerEmail) {
    return NextResponse.json(
      { error: "Paid access is required to create channels." },
      { status: 401 }
    );
  }

  let payload: CreateChannelPayload;

  try {
    payload = (await request.json()) as CreateChannelPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (!payload.name || !payload.description || !payload.theme || !payload.lineup) {
    return NextResponse.json(
      { error: "name, description, theme, and lineup are required." },
      { status: 400 }
    );
  }

  const lineupRows = payload.lineup
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);

  if (lineupRows.length < 2) {
    return NextResponse.json(
      { error: "Add at least two YouTube videos for a proper channel loop." },
      { status: 400 }
    );
  }

  try {
    const programs = await Promise.all(
      lineupRows.map(async (row) => {
        const { url, durationSec } = parseDuration(row);
        const metadata = await fetchYouTubeMetadata(url);

        return {
          id: randomUUID(),
          title: metadata.title,
          videoId: metadata.videoId,
          sourceUrl: metadata.watchUrl,
          durationSec
        };
      })
    );

    const channel = await createChannel({
      name: payload.name,
      description: payload.description,
      theme: payload.theme,
      logoUrl: payload.logoUrl?.trim() || programs[0].sourceUrl.replace("watch?v=", "vi/") + "/hqdefault.jpg",
      breakEvery:
        typeof payload.breakEvery === "number" && payload.breakEvery > 0
          ? Math.min(Math.max(payload.breakEvery, 1), 8)
          : 3,
      breakDurationSec:
        typeof payload.breakDurationSec === "number" && payload.breakDurationSec >= 15
          ? Math.min(Math.max(payload.breakDurationSec, 15), 300)
          : 90,
      programs
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to create channel.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
