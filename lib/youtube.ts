import { google } from "googleapis";

export type YouTubeChannelSummary = {
  channelId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  handle?: string;
  videoCount?: number;
};

export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelId: string;
  channelTitle: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
};

function getYouTubeApiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error("YOUTUBE_API_KEY is missing. Add it to your environment to fetch channel videos.");
  }
  return key;
}

function getYouTubeClient() {
  return google.youtube({
    version: "v3",
    auth: getYouTubeApiKey()
  });
}

function cleanChannelQuery(input: string) {
  return input.trim();
}

function extractChannelId(input: string) {
  const normalized = input.trim();
  const fromRawId = normalized.match(/^(UC[\w-]{22})$/);
  if (fromRawId?.[1]) {
    return fromRawId[1];
  }

  const fromUrl = normalized.match(/youtube\.com\/channel\/(UC[\w-]{22})/i);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }

  return null;
}

function extractHandle(input: string) {
  const normalized = input.trim();
  const fromHandle = normalized.match(/^@([\w.-]{3,30})$/);
  if (fromHandle?.[1]) {
    return fromHandle[1];
  }

  const fromUrl = normalized.match(/youtube\.com\/@([\w.-]{3,30})/i);
  if (fromUrl?.[1]) {
    return fromUrl[1];
  }

  return null;
}

function bestThumbnail(thumbnails: Record<string, { url?: string } | undefined> | undefined) {
  return (
    thumbnails?.maxres?.url ??
    thumbnails?.high?.url ??
    thumbnails?.medium?.url ??
    thumbnails?.default?.url ??
    ""
  );
}

async function fetchChannelById(channelId: string): Promise<YouTubeChannelSummary | null> {
  const youtube = getYouTubeClient();
  const response = await youtube.channels.list({
    id: [channelId],
    part: ["snippet", "statistics"]
  });

  const item = response.data.items?.[0];
  if (!item?.id || !item.snippet?.title) {
    return null;
  }

  return {
    channelId: item.id,
    title: item.snippet.title,
    description: item.snippet.description ?? "",
    thumbnailUrl: bestThumbnail(item.snippet.thumbnails as Record<string, { url?: string } | undefined>),
    handle: item.snippet.customUrl ?? undefined,
    videoCount: Number(item.statistics?.videoCount ?? 0)
  };
}

async function searchForChannel(query: string): Promise<YouTubeChannelSummary | null> {
  const youtube = getYouTubeClient();
  const search = await youtube.search.list({
    part: ["snippet"],
    q: query,
    type: ["channel"],
    maxResults: 1
  });

  const candidate = search.data.items?.[0];
  const channelId = candidate?.id?.channelId;
  if (!channelId) {
    return null;
  }

  return fetchChannelById(channelId);
}

export async function resolveChannel(input: string): Promise<YouTubeChannelSummary> {
  const query = cleanChannelQuery(input);

  if (!query) {
    throw new Error("Add a channel URL, @handle, or channel ID.");
  }

  const channelId = extractChannelId(query);
  if (channelId) {
    const byId = await fetchChannelById(channelId);
    if (byId) {
      return byId;
    }
  }

  const handle = extractHandle(query);
  if (handle) {
    const byHandle = await searchForChannel(handle);
    if (byHandle) {
      return byHandle;
    }
  }

  const byQuery = await searchForChannel(query.replace(/^https?:\/\//, ""));
  if (byQuery) {
    return byQuery;
  }

  throw new Error("No matching YouTube channel was found for that input.");
}

export async function getRecentVideos(channelId: string, maxResults = 12): Promise<YouTubeVideo[]> {
  const youtube = getYouTubeClient();
  const response = await youtube.search.list({
    channelId,
    part: ["snippet"],
    maxResults,
    order: "date",
    type: ["video"]
  });

  return (response.data.items ?? [])
    .map((item) => {
      const videoId = item.id?.videoId;
      const snippet = item.snippet;
      if (!videoId || !snippet?.title || !snippet.channelId) {
        return null;
      }

      return {
        videoId,
        title: snippet.title,
        channelId: snippet.channelId,
        channelTitle: snippet.channelTitle ?? "Unknown Channel",
        description: snippet.description ?? "",
        thumbnailUrl: bestThumbnail(snippet.thumbnails as Record<string, { url?: string } | undefined>),
        publishedAt: snippet.publishedAt ?? new Date(0).toISOString()
      };
    })
    .filter((video): video is YouTubeVideo => video !== null);
}

export async function buildContinuousLineup(channelIds: string[], perChannel = 8): Promise<YouTubeVideo[]> {
  const uniqueChannelIds = Array.from(new Set(channelIds.filter(Boolean)));

  const perChannelVideos = await Promise.all(
    uniqueChannelIds.map(async (channelId) => {
      const videos = await getRecentVideos(channelId, perChannel);
      return videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    })
  );

  const lineup: YouTubeVideo[] = [];
  let didAdd = true;

  while (didAdd && lineup.length < uniqueChannelIds.length * perChannel) {
    didAdd = false;

    for (const list of perChannelVideos) {
      const nextVideo = list.shift();
      if (nextVideo) {
        lineup.push(nextVideo);
        didAdd = true;
      }
    }
  }

  return lineup;
}
