"use client";

import type { YouTubeVideo } from "@/lib/youtube";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatRelativeDate } from "@/lib/utils";

interface ChannelGuideProps {
  queue: YouTubeVideo[];
  currentVideoId?: string;
  onJumpToVideo?: (videoId: string) => void;
}

export function ChannelGuide({ queue, currentVideoId, onJumpToVideo }: ChannelGuideProps) {
  const upcoming = queue.slice(0, 20);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Channel Guide</CardTitle>
        <CardDescription>
          A live look at your upcoming rotation so you can lean back without hunting for the next clip.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-400">No queued videos yet. Add channels and refresh your feed.</p>
        ) : (
          upcoming.map((video, index) => {
            const isCurrent = video.id === currentVideoId;

            return (
              <div
                key={`${video.id}-${index}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-zinc-100">{video.title}</p>
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="truncate">{video.channelTitle}</span>
                    <span>•</span>
                    <span>{formatRelativeDate(video.publishedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCurrent ? <Badge>Now</Badge> : <Badge variant="muted">Up Next</Badge>}
                  {onJumpToVideo ? (
                    <Button variant="ghost" size="sm" onClick={() => onJumpToVideo(video.id)}>
                      Tune
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
