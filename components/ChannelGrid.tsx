"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, Tv2 } from "lucide-react";
import type { SavedChannel } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ChannelGridProps = {
  channels: SavedChannel[];
};

export default function ChannelGrid({ channels }: ChannelGridProps) {
  const router = useRouter();

  async function removeChannel(channelId: string) {
    const response = await fetch("/api/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "remove", channelId })
    });

    if (response.ok) {
      router.refresh();
    }
  }

  if (channels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Channels Yet</CardTitle>
          <CardDescription>Add your favorite creators above to start a continuous TV-style stream.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-[#f0f6fc]">Your Channel Lineup</h2>
        <Link href="/tv/lineup">
          <Button>
            <Tv2 className="mr-2 h-4 w-4" />
            Watch Full Lineup
          </Button>
        </Link>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {channels.map((channel) => (
          <Card key={channel.channelId} className="overflow-hidden">
            <div className="aspect-video bg-[#0d1117]">
              <img alt={channel.title} className="h-full w-full object-cover" loading="lazy" src={channel.thumbnailUrl} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="line-clamp-1 text-base">{channel.title}</CardTitle>
              <CardDescription className="line-clamp-2">{channel.description || "No public description provided."}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-2">
              <Link href={`/tv/${channel.channelId}`}>
                <Button size="sm" variant="outline">
                  <Tv2 className="mr-2 h-4 w-4" />
                  Watch
                </Button>
              </Link>
              <button
                aria-label={`Remove ${channel.title}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#30363d] text-[#9aa4b2] transition hover:bg-[#1f2733] hover:text-[#ff7b72]"
                onClick={() => void removeChannel(channel.channelId)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
