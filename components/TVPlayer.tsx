"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo } from "react";
import { create } from "zustand";
import { ArrowLeft, ArrowRight, Radio } from "lucide-react";

import ChannelGuide from "@/components/ChannelGuide";
import { Button } from "@/components/ui/button";
import type { YouTubeChannel } from "@/types";

const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false });

type TVState = {
  channels: YouTubeChannel[];
  activeChannelId: string | null;
  playheads: Record<string, number>;
  hydrate(channels: YouTubeChannel[]): void;
  setActiveChannel(channelId: string): void;
  next(): void;
  previous(): void;
};

const useTVStore = create<TVState>((set, get) => ({
  channels: [],
  activeChannelId: null,
  playheads: {},
  hydrate(channels) {
    const playheads: Record<string, number> = {};

    for (const channel of channels) {
      if (channel.videos.length === 0) {
        playheads[channel.id] = 0;
        continue;
      }

      playheads[channel.id] = Math.floor(Math.random() * channel.videos.length);
    }

    set({
      channels,
      playheads,
      activeChannelId: channels[0]?.id ?? null
    });
  },
  setActiveChannel(channelId) {
    set({ activeChannelId: channelId });
  },
  next() {
    const state = get();
    if (!state.activeChannelId) {
      return;
    }

    const channel = state.channels.find((entry) => entry.id === state.activeChannelId);
    if (!channel || channel.videos.length === 0) {
      return;
    }

    const current = state.playheads[state.activeChannelId] ?? 0;
    const nextIndex = (current + 1) % channel.videos.length;

    set({
      playheads: {
        ...state.playheads,
        [state.activeChannelId]: nextIndex
      }
    });
  },
  previous() {
    const state = get();
    if (!state.activeChannelId) {
      return;
    }

    const channel = state.channels.find((entry) => entry.id === state.activeChannelId);
    if (!channel || channel.videos.length === 0) {
      return;
    }

    const current = state.playheads[state.activeChannelId] ?? 0;
    const prevIndex = (current - 1 + channel.videos.length) % channel.videos.length;

    set({
      playheads: {
        ...state.playheads,
        [state.activeChannelId]: prevIndex
      }
    });
  }
}));

type TVPlayerProps = {
  channels: YouTubeChannel[];
};

export default function TVPlayer({ channels }: TVPlayerProps) {
  const {
    channels: hydratedChannels,
    activeChannelId,
    playheads,
    hydrate,
    setActiveChannel,
    next,
    previous
  } = useTVStore();

  useEffect(() => {
    hydrate(channels);
  }, [channels, hydrate]);

  const activeChannel = useMemo(
    () => hydratedChannels.find((channel) => channel.id === activeChannelId) ?? null,
    [hydratedChannels, activeChannelId]
  );

  const activeVideo = useMemo(() => {
    if (!activeChannel) {
      return null;
    }

    if (activeChannel.videos.length === 0) {
      return null;
    }

    const playhead = playheads[activeChannel.id] ?? 0;
    return activeChannel.videos[playhead] ?? null;
  }, [activeChannel, playheads]);

  const nowPlayingByChannel = useMemo(() => {
    const lookup: Record<string, string> = {};

    for (const channel of hydratedChannels) {
      if (channel.videos.length === 0) {
        lookup[channel.id] = "No recent videos";
        continue;
      }

      const playhead = playheads[channel.id] ?? 0;
      lookup[channel.id] = channel.videos[playhead]?.title || "No recent videos";
    }

    return lookup;
  }, [hydratedChannels, playheads]);

  return (
    <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            {activeVideo ? (
              <ReactPlayer
                key={`${activeChannel?.id}-${activeVideo.id}`}
                url={activeVideo.url}
                width="100%"
                height="100%"
                controls
                playing
                onEnded={next}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                {activeChannel ? "No playable videos for this channel yet." : "No channel selected."}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">Now Playing</p>
              <p className="text-lg font-semibold text-slate-100">{activeChannel?.title || "Idle"}</p>
              <p className="line-clamp-2 text-sm text-slate-300">{activeVideo?.title || "Pick a channel to start."}</p>
            </div>
            <Radio className="h-5 w-5 text-cyan-300" />
          </div>

          <div className="flex gap-2">
            <Button variant="secondary" onClick={previous}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button onClick={next}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ChannelGuide
        channels={hydratedChannels}
        activeChannelId={activeChannelId}
        nowPlayingByChannel={nowPlayingByChannel}
        onSelect={setActiveChannel}
      />
    </section>
  );
}
