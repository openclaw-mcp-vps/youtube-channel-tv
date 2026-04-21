import { google } from "googleapis";

export interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  durationSeconds: number;
  url: string;
}

const cache = new Map<string, { expiresAt: number; data: unknown }>();

function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY");
  }

  return google.youtube({
    version: "v3",
    auth: apiKey
  });
}

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs
  });
}

function parseDurationToSeconds(isoDuration: string | null | undefined) {
  if (!isoDuration) return 0;

  const match = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/.exec(isoDuration);
  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

export async function searchChannels(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const cacheKey = `search:${trimmed.toLowerCase()}`;
  const cached = getFromCache<YouTubeChannel[]>(cacheKey);
  if (cached) return cached;

  const youtube = getYouTubeClient();
  const response = await youtube.search.list({
    part: ["snippet"],
    q: trimmed,
    type: ["channel"],
    maxResults: 8
  });

  const channels =
    response.data.items
      ?.map((item) => {
        if (!item.id?.channelId || !item.snippet?.title) return null;

        return {
          id: item.id.channelId,
          title: item.snippet.title,
          description: item.snippet.description ?? "",
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? ""
        } satisfies YouTubeChannel;
      })
      .filter((channel): channel is YouTubeChannel => Boolean(channel)) ?? [];

  setCache(cacheKey, channels, 5 * 60 * 1000);
  return channels;
}

export async function getChannelsByIds(channelIds: string[]) {
  if (!channelIds.length) return [];

  const normalized = channelIds.join(",");
  const cacheKey = `channels:${normalized}`;
  const cached = getFromCache<YouTubeChannel[]>(cacheKey);
  if (cached) return cached;

  const youtube = getYouTubeClient();

  const response = await youtube.channels.list({
    part: ["snippet"],
    id: channelIds,
    maxResults: channelIds.length
  });

  const channels =
    response.data.items
      ?.map((item) => {
        if (!item.id || !item.snippet?.title) return null;

        return {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description ?? "",
          thumbnailUrl:
            item.snippet.thumbnails?.high?.url ?? item.snippet.thumbnails?.default?.url ?? ""
        } satisfies YouTubeChannel;
      })
      .filter((channel): channel is YouTubeChannel => Boolean(channel)) ?? [];

  setCache(cacheKey, channels, 10 * 60 * 1000);
  return channels;
}

export async function getLatestChannelVideos(channelId: string, maxResults = 12) {
  const cacheKey = `videos:${channelId}:${maxResults}`;
  const cached = getFromCache<YouTubeVideo[]>(cacheKey);
  if (cached) return cached;

  const youtube = getYouTubeClient();

  const searchResponse = await youtube.search.list({
    part: ["snippet"],
    channelId,
    type: ["video"],
    maxResults,
    order: "date"
  });

  const videoIds =
    searchResponse.data.items
      ?.map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id)) ?? [];

  if (!videoIds.length) {
    return [];
  }

  const videosResponse = await youtube.videos.list({
    part: ["contentDetails", "snippet"],
    id: videoIds
  });

  const videos =
    videosResponse.data.items
      ?.map((item) => {
        const id = item.id;
        const snippet = item.snippet;

        if (!id || !snippet?.title || !snippet.channelId || !snippet.channelTitle || !snippet.publishedAt) {
          return null;
        }

        const durationSeconds = parseDurationToSeconds(item.contentDetails?.duration);

        // Skip shorts-style videos to keep TV flow relaxed and long-form.
        if (durationSeconds > 0 && durationSeconds < 75) {
          return null;
        }

        return {
          id,
          title: snippet.title,
          description: snippet.description ?? "",
          channelId: snippet.channelId,
          channelTitle: snippet.channelTitle,
          publishedAt: snippet.publishedAt,
          thumbnailUrl: snippet.thumbnails?.high?.url ?? snippet.thumbnails?.default?.url ?? "",
          durationSeconds,
          url: `https://www.youtube.com/watch?v=${id}`
        } satisfies YouTubeVideo;
      })
      .filter((video): video is YouTubeVideo => Boolean(video)) ?? [];

  const sorted = videos.sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  setCache(cacheKey, sorted, 8 * 60 * 1000);
  return sorted;
}

export async function buildContinuousQueue(channelIds: string[], perChannel = 10) {
  const uniqueChannelIds = [...new Set(channelIds)];
  if (!uniqueChannelIds.length) return [];

  const allChannelVideos = await Promise.all(
    uniqueChannelIds.map(async (channelId) => ({
      channelId,
      videos: await getLatestChannelVideos(channelId, perChannel)
    }))
  );

  const queue: YouTubeVideo[] = [];
  const working = allChannelVideos.map((entry) => ({ ...entry, cursor: 0 }));

  let hasMore = true;

  while (hasMore) {
    hasMore = false;

    for (const entry of working) {
      const nextVideo = entry.videos[entry.cursor];
      if (nextVideo) {
        queue.push(nextVideo);
        entry.cursor += 1;
        hasMore = true;
      }
    }
  }

  const deduped = queue.filter(
    (video, index, array) => array.findIndex((candidate) => candidate.id === video.id) === index
  );

  return deduped;
}
