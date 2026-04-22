"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ListVideo, SkipBack, SkipForward } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TVChannel, TVVideo } from "@/lib/types";

const ReactPlayer = dynamic(() => import("react-player/youtube"), { ssr: false });

type TVPlayerProps = {
  channel: TVChannel;
  videos: TVVideo[];
  lineup: TVChannel[];
};

export function TVPlayer({ channel, videos, lineup }: TVPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentVideo = videos[currentIndex];

  const neighbors = useMemo(() => {
    const currentPosition = lineup.findIndex(
      (lineupChannel) => lineupChannel.channelId === channel.channelId
    );

    if (currentPosition === -1 || lineup.length === 0) {
      return { prev: null, next: null };
    }

    const prev = lineup[(currentPosition - 1 + lineup.length) % lineup.length] ?? null;
    const next = lineup[(currentPosition + 1) % lineup.length] ?? null;

    return { prev, next };
  }, [lineup, channel.channelId]);

  if (!currentVideo) {
    return (
      <Card>
        <CardContent className="p-6 text-slate-300">
          No playable videos were found for this channel.
        </CardContent>
      </Card>
    );
  }

  const advance = () => {
    setCurrentIndex((index) => (index + 1) % videos.length);
  };

  const rewind = () => {
    setCurrentIndex((index) => (index - 1 + videos.length) % videos.length);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <Card className="overflow-hidden border-cyan-500/20 bg-slate-950/70">
        <CardContent className="p-0">
          <div className="aspect-video w-full bg-black">
            <ReactPlayer
              key={currentVideo.videoId}
              url={currentVideo.url}
              width="100%"
              height="100%"
              controls
              playing
              onEnded={advance}
              onError={advance}
              config={{
                playerVars: {
                  autoplay: 1,
                  rel: 0,
                  modestbranding: 1
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="h-fit border-slate-800 bg-slate-900/70">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg text-slate-100">Now Playing</CardTitle>
            <ListVideo className="size-4 text-slate-400" />
          </div>
          <p className="text-sm text-slate-400">{channel.title}</p>
          <p className="line-clamp-2 text-sm text-slate-200">{currentVideo.title}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={rewind}>
              <SkipBack className="size-4" />
              Back
            </Button>
            <Button variant="secondary" onClick={advance}>
              <SkipForward className="size-4" />
              Next
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">Channel Surf</p>
            {neighbors.prev ? (
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href={`/tv/${neighbors.prev.channelId}`}>Previous: {neighbors.prev.title}</Link>
              </Button>
            ) : null}
            {neighbors.next ? (
              <Button variant="ghost" asChild className="w-full justify-start">
                <Link href={`/tv/${neighbors.next.channelId}`}>Next: {neighbors.next.title}</Link>
              </Button>
            ) : null}
          </div>

          <div className="max-h-72 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
            {videos.map((video, index) => (
              <button
                key={video.videoId}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm transition ${
                  index === currentIndex
                    ? "bg-cyan-500/20 text-cyan-100"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                {video.title}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
