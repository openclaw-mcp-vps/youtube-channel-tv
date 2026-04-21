import { NextRequest, NextResponse } from "next/server";
import { fetchSearchSuggestions, fetchYouTubeMetadata } from "@/lib/youtube";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const query = searchParams.get("q");

  try {
    if (url) {
      const metadata = await fetchYouTubeMetadata(url);
      return NextResponse.json({ metadata });
    }

    if (query) {
      const suggestions = await fetchSearchSuggestions(query);
      return NextResponse.json({ suggestions });
    }

    return NextResponse.json(
      { error: "Pass either ?url=YOUTUBE_URL for metadata or ?q=QUERY for search suggestions." },
      { status: 400 }
    );
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to process YouTube request.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const payload = (await request.json()) as { url?: string };

  if (!payload.url) {
    return NextResponse.json({ error: "url is required." }, { status: 400 });
  }

  try {
    const metadata = await fetchYouTubeMetadata(payload.url);
    return NextResponse.json({ metadata });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "Unable to fetch YouTube metadata.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
