"use client";

import { Tv } from "lucide-react";

import type { YouTubeChannel } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ChannelGuideProps = {
  channels: YouTubeChannel[];
  activeChannelId: string | null;
  nowPlayingByChannel: Record<string, string>;
  onSelect(channelId: string): void;
};

export default function ChannelGuide({
  channels,
  activeChannelId,
  nowPlayingByChannel,
  onSelect
}: ChannelGuideProps) {
  if (channels.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4 text-sm text-slate-300">
        Add channels in the dashboard to populate your TV guide.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
          <Tv className="h-4 w-4 text-cyan-300" />
          Channel Guide
        </div>
        <Badge>{channels.length} channels</Badge>
      </div>

      <div className="space-y-2">
        {channels.map((channel, index) => {
          const isActive = channel.id === activeChannelId;
          return (
            <button
              key={channel.id}
              type="button"
              onClick={() => onSelect(channel.id)}
              className={cn(
                "w-full rounded-xl border px-3 py-2 text-left transition",
                isActive
                  ? "border-cyan-400/60 bg-cyan-500/10"
                  : "border-white/10 bg-slate-950/40 hover:border-white/20 hover:bg-slate-900"
              )}
            >
              <p className="text-xs uppercase tracking-wide text-slate-400">CH {String(index + 1).padStart(2, "0")}</p>
              <p className="truncate text-sm font-medium text-slate-100">{channel.title}</p>
              <p className="truncate text-xs text-slate-400">{nowPlayingByChannel[channel.id] ?? "Offline"}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
