"use client";

import Link from "next/link";
import { Play, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { TVChannel } from "@/lib/types";

type ChannelGridProps = {
  channels: TVChannel[];
  onRemove?: (channelId: string) => void;
};

export function ChannelGrid({ channels, onRemove }: ChannelGridProps) {
  if (channels.length === 0) {
    return (
      <Card className="border-dashed border-slate-700 bg-slate-900/50">
        <CardContent className="py-10 text-center text-slate-400">
          Your lineup is empty. Add creators you trust for chill background viewing.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {channels.map((channel) => (
        <Card key={channel.channelId} className="overflow-hidden border-slate-800 bg-slate-900/65">
          <div className="h-28 w-full bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={channel.thumbnail}
              alt={`${channel.title} thumbnail`}
              className="h-full w-full object-cover"
            />
          </div>
          <CardHeader className="pb-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <Badge variant="secondary">{channel.channelId}</Badge>
            </div>
            <CardTitle className="line-clamp-2 text-base text-slate-100">{channel.title}</CardTitle>
            {channel.description ? (
              <p className="line-clamp-2 text-sm text-slate-400">{channel.description}</p>
            ) : null}
          </CardHeader>
          <CardFooter className="gap-2">
            <Button asChild className="flex-1">
              <Link href={`/tv/${channel.channelId}`}>
                <Play className="size-4" />
                Watch Channel
              </Link>
            </Button>
            {onRemove ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(channel.channelId)}
                aria-label={`Remove ${channel.title}`}
              >
                <Trash2 className="size-4 text-rose-400" />
              </Button>
            ) : null}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
