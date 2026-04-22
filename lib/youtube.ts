import { google } from "googleapis";

import type { TVChannel, TVVideo } from "@/lib/types";

function stripXml(input: string) {
  return input
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

export function resolveChannelId(channelInput: string) {
  const raw = channelInput.trim();

  if (!raw) {
    throw new Error("Channel input is required.");
  }

  const directMatch = raw.match(/(UC[\w-]{22})/);
  if (directMatch?.[1]) {
    return directMatch[1];
  }

  throw new Error(
    "Please enter a valid YouTube channel ID (starts with UC...) or channel URL containing it."
  );
}

function getYoutubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return null;
  }

  return google.youtube({
    version: "v3",
    auth: apiKey
  });
}

async function fetchRssFeed(channelId: string) {
  const feedResponse = await fetch(
    `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
    {
      next: { revalidate: 60 * 10 }
    }
  );

  if (!feedResponse.ok) {
    throw new Error("Unable to load this channel feed right now.");
  }

  return feedResponse.text();
}

function parseRssProfile(xml: string, channelId: string): TVChannel {
  const authorMatch = xml.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/);
  const titleMatch = xml.match(/<title>(.*?)<\/title>/);

  const title = stripXml(authorMatch?.[1] ?? titleMatch?.[1] ?? "YouTube Channel");

  return {
    channelId,
    title,
    thumbnail: `https://i.ytimg.com/vi/${channelId}/hqdefault.jpg`,
    description:
      "Feed-powered channel stream. Add a YouTube API key for richer channel metadata."
  };
}

function parseRssVideos(xml: string): TVVideo[] {
  const chunks = xml.split("<entry>").slice(1);
  const videos: TVVideo[] = [];

  for (const chunk of chunks) {
    const videoId = chunk.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
    const title = chunk.match(/<title>(.*?)<\/title>/)?.[1];
    const publishedAt = chunk.match(/<published>(.*?)<\/published>/)?.[1];
    const thumbnail = chunk.match(/<media:thumbnail[^>]*url="([^"]+)"/)?.[1];
    const description = chunk.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1];

    if (!videoId || !title || !publishedAt) {
      continue;
    }

    videos.push({
      videoId,
      title: stripXml(title),
      publishedAt,
      thumbnail: thumbnail ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      description: description ? stripXml(description) : ""
    });
  }

  return videos;
}

export async function fetchChannelProfile(channelId: string): Promise<TVChannel> {
  const youtube = getYoutubeClient();

  if (youtube) {
    try {
      const response = await youtube.channels.list({
        id: [channelId],
        part: ["snippet"]
      });

      const item = response.data.items?.[0];

      if (item?.id && item.snippet?.title) {
        return {
          channelId: item.id,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.high?.url ??
            item.snippet.thumbnails?.default?.url ??
            `https://i.ytimg.com/vi/${channelId}/hqdefault.jpg`,
          description: item.snippet.description ?? ""
        };
      }
    } catch {
      // Falls back to RSS
    }
  }

  const xml = await fetchRssFeed(channelId);
  return parseRssProfile(xml, channelId);
}

export async function fetchChannelVideos(
  channelId: string,
  maxResults = 30
): Promise<TVVideo[]> {
  const youtube = getYoutubeClient();

  if (youtube) {
    try {
      const response = await youtube.search.list({
        channelId,
        part: ["id", "snippet"],
        type: ["video"],
        order: "date",
        maxResults: Math.min(maxResults, 50)
      });

      const items = response.data.items ?? [];
      const videos: TVVideo[] = [];

      for (const item of items) {
        const videoId = item.id?.videoId;
        const title = item.snippet?.title;
        const publishedAt = item.snippet?.publishedAt;

        if (!videoId || !title || !publishedAt) {
          continue;
        }

        videos.push({
          videoId,
          title,
          publishedAt,
          thumbnail:
            item.snippet?.thumbnails?.high?.url ??
            item.snippet?.thumbnails?.default?.url ??
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          description: item.snippet?.description ?? ""
        });
      }

      if (videos.length > 0) {
        return videos;
      }
    } catch {
      // Falls back to RSS
    }
  }

  const xml = await fetchRssFeed(channelId);
  const videos = parseRssVideos(xml);

  return videos.slice(0, maxResults);
}
