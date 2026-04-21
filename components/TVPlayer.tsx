"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { SkipBack, SkipForward, Tv2 } from "lucide-react";
import type { YouTubeVideo } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ReactPlayer = dynamic(() => import("react-player"), { ssr: false });

type TVPlayerProps = {
  channelIds: string[];
  headline: string;
};

type YouTubeApiPayload = {
  playlist?: YouTubeVideo[];
  error?: string;
};

export default function TVPlayer({ channelIds, headline }: TVPlayerProps) {
  const [playlist, setPlaylist] = useState<YouTubeVideo[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => channelIds.join(","), [channelIds]);

  useEffect(() => {
    let cancelled = false;

    async function loadPlaylist() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/youtube?channels=${encodeURIComponent(query)}`);
        const payload = (await response.json()) as YouTubeApiPayload;

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load playlist.");
        }

        if (!cancelled) {
          const items = payload.playlist ?? [];
          setPlaylist(items);
          setActiveIndex(0);
        }
      } catch (loadError) {
        if (!cancelled) {
          const message = loadError instanceof Error ? loadError.message : "Failed to load videos.";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    if (query) {
      void loadPlaylist();
    } else {
      setLoading(false);
      setError("No channels selected.");
    }

    return () => {
      cancelled = true;
    };
  }, [query]);

  const activeVideo = playlist[activeIndex];

  function next() {
    setActiveIndex((previous) => (playlist.length ? (previous + 1) % playlist.length : 0));
  }

  function previous() {
    setActiveIndex((previous) =>
      playlist.length ? (previous - 1 + playlist.length) % playlist.length : 0
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv2 className="h-5 w-5 text-[#58a6ff]" />
            Loading {headline}
          </CardTitle>
          <CardDescription>Preparing your continuous stream...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Player Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!activeVideo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Videos Available</CardTitle>
          <CardDescription>This channel lineup does not have recent videos yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const nextVideos = playlist.slice(activeIndex + 1, activeIndex + 5);

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="aspect-video bg-black">
          <ReactPlayer
            controls
            height="100%"
            onEnded={next}
            onError={next}
            playing
            src={`https://www.youtube.com/watch?v=${activeVideo.videoId}`}
            width="100%"
          />
        </div>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm text-[#58a6ff]">Now Playing</p>
            <h2 className="text-2xl font-semibold text-[#f0f6fc]">{activeVideo.title}</h2>
            <p className="text-sm text-[#9aa4b2]">{activeVideo.channelTitle}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={previous} variant="outline">
              <SkipBack className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={next} variant="outline">
              <SkipForward className="mr-2 h-4 w-4" />
              Next
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Up Next</CardTitle>
          <CardDescription>Your stream auto-advances when each video ends.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {nextVideos.length === 0 ? <p className="text-sm text-[#9aa4b2]">No queued videos left.</p> : null}
            {nextVideos.map((video) => (
              <div
                className="flex items-center gap-3 rounded-md border border-[#30363d] bg-[#0d1117] p-3"
                key={`${video.videoId}-${video.publishedAt}`}
              >
                <img alt={video.title} className="h-16 w-28 rounded object-cover" loading="lazy" src={video.thumbnailUrl} />
                <div>
                  <p className="line-clamp-2 text-sm font-medium text-[#f0f6fc]">{video.title}</p>
                  <p className="text-xs text-[#9aa4b2]">{video.channelTitle}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
