"use client";

import { useEffect, useMemo, useState } from "react";
import { RadioTower } from "lucide-react";

import { ChannelGrid } from "@/components/ChannelGrid";
import { ChannelSelector } from "@/components/ChannelSelector";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TVChannel } from "@/lib/types";

type ChannelResponse = {
  channels: TVChannel[];
  error?: string;
};

export function DashboardClient() {
  const [channels, setChannels] = useState<TVChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadChannels() {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch("/api/channels", { cache: "no-store" });
        const data = (await response.json()) as ChannelResponse;

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load channels.");
        }

        if (active) {
          setChannels(data.channels ?? []);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your lineup right now."
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadChannels();

    return () => {
      active = false;
    };
  }, []);

  async function updateLineup(payload: Record<string, unknown>) {
    setError("");

    const response = await fetch("/api/channels", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = (await response.json()) as ChannelResponse;

    if (!response.ok) {
      throw new Error(data.error ?? "Lineup update failed.");
    }

    setChannels(data.channels ?? []);
  }

  async function handleAdd(channel: TVChannel) {
    try {
      await updateLineup({ action: "add", channel });
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Could not add channel.");
    }
  }

  async function handleRemove(channelId: string) {
    try {
      await updateLineup({ action: "remove", channelId });
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Could not remove channel."
      );
    }
  }

  const totalChannels = useMemo(() => channels.length, [channels]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900/70">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl text-slate-100">Your TV Control Room</CardTitle>
            <Badge>{totalChannels} channels</Badge>
          </div>
          <p className="max-w-3xl text-sm text-slate-400">
            Build a creator lineup once, then jump into any channel and let videos roll
            continuously. No endless browsing tabs, no decision fatigue.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            <RadioTower className="size-4" />
            Continuous autoplay is active in TV mode.
          </div>
        </CardContent>
      </Card>

      <ChannelSelector existingIds={channels.map((channel) => channel.channelId)} onAdd={handleAdd} />

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-slate-300">Loading your lineup...</CardContent>
        </Card>
      ) : (
        <ChannelGrid channels={channels} onRemove={handleRemove} />
      )}

      {error ? <p className="text-sm text-rose-400">{error}</p> : null}
    </div>
  );
}
