import { google } from "googleapis";

import type { YouTubeChannel, YouTubeVideo } from "@/types";

const FALLBACK_THUMBNAIL = "https://i.ytimg.com/vi/default/default.jpg";

function getYouTubeClient() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing YOUTUBE_API_KEY. Set it in your environment variables.");
  }

  return google.youtube({
    version: "v3",
    auth: apiKey
  });
}

function extractChannelIdFromUrl(input: string) {
  const match = input.match(/youtube\.com\/channel\/(UC[\w-]{20,})/i);
  return match ? match[1] : null;
}

function extractHandle(input: string) {
  const fromUrl = input.match(/youtube\.com\/(?:@|user\/)?([\w.-]+)/i);

  if (input.startsWith("@")) {
    return input.slice(1);
  }

  if (fromUrl && input.includes("@")) {
    return fromUrl[1]?.replace(/^@/, "") || null;
  }

  if (fromUrl && input.includes("youtube.com/user/")) {
    return fromUrl[1] || null;
  }

  return null;
}

async function resolveChannelId(input: string) {
  const query = input.trim();
  const fromUrl = extractChannelIdFromUrl(query);

  if (fromUrl) {
    return fromUrl;
  }

  if (query.startsWith("UC") && query.length >= 20) {
    return query;
  }

  const youtube = getYouTubeClient();

  if (query.includes("youtube.com/user/")) {
    const userHandle = extractHandle(query);
    if (userHandle) {
      const byUsername = await youtube.channels.list({
        part: ["id"],
        forUsername: userHandle,
        maxResults: 1
      });

      const usernameMatch = byUsername.data.items?.[0]?.id;
      if (usernameMatch) {
        return usernameMatch;
      }
    }
  }

  const handle = extractHandle(query) || query.replace(/^@/, "");
  const search = await youtube.search.list({
    part: ["snippet"],
    q: handle,
    type: ["channel"],
    maxResults: 1
  });

  const match = search.data.items?.[0]?.snippet?.channelId;
  if (!match) {
    throw new Error("No channel found for that input.");
  }

  return match;
}

function formatDuration(isoDuration: string | null | undefined) {
  if (!isoDuration) {
    return "Unknown";
  }

  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) {
    return "Unknown";
  }

  const hours = Number.parseInt(match[1] || "0", 10);
  const minutes = Number.parseInt(match[2] || "0", 10);
  const seconds = Number.parseInt(match[3] || "0", 10);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

async function fetchVideosForUploads(uploadsPlaylistId: string, channelId: string, channelTitle: string) {
  const youtube = getYouTubeClient();

  const playlistResponse = await youtube.playlistItems.list({
    part: ["snippet", "contentDetails"],
    playlistId: uploadsPlaylistId,
    maxResults: 20
  });

  const playlistItems = playlistResponse.data.items ?? [];
  const videoIds = playlistItems
    .map((item) => item.contentDetails?.videoId)
    .filter((value): value is string => Boolean(value));

  let durations = new Map<string, string>();

  if (videoIds.length > 0) {
    const videosResponse = await youtube.videos.list({
      part: ["contentDetails"],
      id: videoIds
    });

    durations = new Map(
      (videosResponse.data.items ?? [])
        .map((item) => [item.id, formatDuration(item.contentDetails?.duration)] as const)
        .filter((entry): entry is readonly [string, string] => Boolean(entry[0]))
    );
  }

  const videos: YouTubeVideo[] = playlistItems
    .map((item) => {
      const videoId = item.contentDetails?.videoId;
      const snippet = item.snippet;

      if (!videoId || !snippet?.title || !snippet.publishedAt) {
        return null;
      }

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description || "",
        publishedAt: snippet.publishedAt,
        thumbnailUrl:
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.medium?.url ||
          snippet.thumbnails?.default?.url ||
          FALLBACK_THUMBNAIL,
        duration: durations.get(videoId) || "Unknown",
        channelId,
        channelTitle,
        url: `https://www.youtube.com/watch?v=${videoId}`
      } satisfies YouTubeVideo;
    })
    .filter((video): video is YouTubeVideo => video !== null);

  return videos;
}

export async function getChannelWithVideos(input: string): Promise<YouTubeChannel> {
  const channelId = await resolveChannelId(input);
  const youtube = getYouTubeClient();

  const channelResponse = await youtube.channels.list({
    part: ["snippet", "contentDetails"],
    id: [channelId],
    maxResults: 1
  });

  const channel = channelResponse.data.items?.[0];
  if (!channel?.id || !channel.snippet || !channel.contentDetails?.relatedPlaylists?.uploads) {
    throw new Error("Channel was found, but its uploads feed could not be loaded.");
  }

  const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;

  const title = channel.snippet.title || "Untitled Channel";
  const videos = await fetchVideosForUploads(uploadsPlaylistId, channel.id, title);

  return {
    id: channel.id,
    title,
    description: channel.snippet.description || "",
    thumbnailUrl:
      channel.snippet.thumbnails?.high?.url ||
      channel.snippet.thumbnails?.medium?.url ||
      channel.snippet.thumbnails?.default?.url ||
      FALLBACK_THUMBNAIL,
    uploadsPlaylistId,
    videos
  };
}
