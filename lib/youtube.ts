const YOUTUBE_ID_REGEX =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;

export interface YouTubeMetadata {
  videoId: string;
  title: string;
  authorName: string;
  thumbnailUrl: string;
  watchUrl: string;
}

export function extractYouTubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(YOUTUBE_ID_REGEX);

  if (match?.[1]) {
    return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

export async function fetchYouTubeMetadata(input: string): Promise<YouTubeMetadata> {
  const videoId = extractYouTubeVideoId(input);

  if (!videoId) {
    throw new Error("Invalid YouTube URL or video ID.");
  }

  const watchUrl = buildYouTubeWatchUrl(videoId);
  const oEmbedResponse = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(watchUrl)}&format=json`,
    { cache: "no-store" }
  );

  if (!oEmbedResponse.ok) {
    throw new Error("Unable to fetch video metadata from YouTube.");
  }

  const oEmbed = (await oEmbedResponse.json()) as {
    title: string;
    author_name: string;
    thumbnail_url: string;
  };

  return {
    videoId,
    title: oEmbed.title,
    authorName: oEmbed.author_name,
    thumbnailUrl: oEmbed.thumbnail_url,
    watchUrl
  };
}

export async function fetchSearchSuggestions(query: string): Promise<string[]> {
  const trimmed = query.trim();

  if (!trimmed) {
    return [];
  }

  const response = await fetch(
    `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(trimmed)}`,
    { cache: "no-store" }
  );

  if (!response.ok) {
    return [];
  }

  const json = (await response.json()) as [string, string[]];
  return json[1] ?? [];
}
