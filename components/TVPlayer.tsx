"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { RefreshCw, Tv } from "lucide-react";
import type { YouTubeChannel, YouTubeVideo } from "@/lib/youtube";
import { ChannelGuide } from "@/components/ChannelGuide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ReactPlayer = dynamic(() => import("react-player/youtube"), {
  ssr: false
});

interface TVPlayerProps {
  channels: YouTubeChannel[];
}

export function TVPlayer({ channels }: TVPlayerProps) {
  const [queue, setQueue] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeChannelId, setActiveChannelId] = useState<string>("all");

  const channelIds = useMemo(() => channels.map((channel) => channel.id), [channels]);

  const currentVideo = queue[currentIndex] ?? null;

  const fetchQueue = useCallback(async () => {
    if (!channelIds.length) {
      setQueue([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        action: "build-queue",
        channelIds: channelIds.join(","),
        perChannel: "12"
      });

      const response = await fetch(`/api/youtube?${params.toString()}`);
      const payload = (await response.json()) as { queue?: YouTubeVideo[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load TV queue.");
      }

      setQueue(payload.queue ?? []);
      setCurrentIndex(0);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not build TV queue.");
    } finally {
      setLoading(false);
    }
  }, [channelIds]);

  useEffect(() => {
    void fetchQueue();
  }, [fetchQueue]);

  const playNext = useCallback(() => {
    if (!queue.length) return;

    if (activeChannelId === "all") {
      setCurrentIndex((index) => {
        if (index + 1 < queue.length) return index + 1;
        return 0;
      });
      return;
    }

    setCurrentIndex((index) => {
      for (let cursor = index + 1; cursor < queue.length; cursor += 1) {
        if (queue[cursor]?.channelId === activeChannelId) {
          return cursor;
        }
      }

      for (let cursor = 0; cursor <= index; cursor += 1) {
        if (queue[cursor]?.channelId === activeChannelId) {
          return cursor;
        }
      }

      return index;
    });
  }, [activeChannelId, queue]);

  function tuneChannel(channelId: string) {
    setActiveChannelId(channelId);

    if (channelId === "all") {
      return;
    }

    const match = queue.findIndex((video) => video.channelId === channelId);
    if (match >= 0) {
      setCurrentIndex(match);
    }
  }

  function jumpToVideo(videoId: string) {
    const index = queue.findIndex((video) => video.id === videoId);
    if (index >= 0) {
      setCurrentIndex(index);
      setActiveChannelId(queue[index]?.channelId ?? "all");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-cyan-300" />
            Passive TV Stream
          </CardTitle>
          <CardDescription>
            Videos auto-play in sequence so you can keep focus while your lineup runs in the background.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeChannelId === "all" ? "default" : "secondary"}
              size="sm"
              onClick={() => tuneChannel("all")}
            >
              All Channels
            </Button>
            {channels.map((channel) => (
              <Button
                key={channel.id}
                variant={activeChannelId === channel.id ? "default" : "secondary"}
                size="sm"
                onClick={() => tuneChannel(channel.id)}
              >
                {channel.title}
              </Button>
            ))}
          </div>

          <div className="overflow-hidden rounded-lg border border-white/15 bg-black">
            <div className="relative aspect-video">
              {currentVideo ? (
                <ReactPlayer
                  key={`${currentVideo.id}-${currentIndex}`}
                  url={currentVideo.url}
                  playing
                  controls
                  width="100%"
                  height="100%"
                  onEnded={playNext}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">
                  {loading ? "Loading your channel feed..." : "No videos yet. Add channels in Dashboard."}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-100">{currentVideo?.title ?? "Waiting for lineup"}</p>
              <p className="text-xs text-zinc-400">{currentVideo?.channelTitle ?? ""}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="muted">{currentIndex + 1}/{Math.max(queue.length, 1)}</Badge>
              <Button variant="secondary" size="sm" onClick={playNext} disabled={!queue.length}>
                Next
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void fetchQueue()} disabled={loading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </div>
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
        </CardContent>
      </Card>
      <ChannelGuide queue={queue.slice(currentIndex)} currentVideoId={currentVideo?.id} onJumpToVideo={jumpToVideo} />
    </div>
  );
}
