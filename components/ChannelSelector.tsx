"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Loader2, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { TVChannel } from "@/lib/types";

type ChannelSelectorProps = {
  existingIds: string[];
  onAdd: (channel: TVChannel) => void;
};

export function ChannelSelector({ existingIds, onAdd }: ChannelSelectorProps) {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = input.trim();
    if (!value) {
      setError("Enter a YouTube channel ID or channel URL.");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`/api/youtube?channel=${encodeURIComponent(value)}`);
      const data = (await response.json()) as
        | { channel?: TVChannel; error?: string }
        | undefined;

      if (!response.ok || !data?.channel) {
        throw new Error(data?.error ?? "Channel lookup failed.");
      }

      if (existingIds.includes(data.channel.channelId)) {
        setError("That channel is already in your lineup.");
        return;
      }

      onAdd(data.channel);
      setInput("");
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Could not add channel.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="tv-static border-cyan-500/20">
      <CardHeader>
        <CardTitle className="text-xl text-slate-100">Build Your Channel Lineup</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={handleSubmit}>
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Paste channel URL or UC... channel ID"
            className="sm:flex-1"
            aria-label="YouTube channel"
          />
          <Button type="submit" className="sm:w-auto" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <PlusCircle className="size-4" />
                Add Channel
              </>
            )}
          </Button>
        </form>
        <p className="mt-3 text-xs text-slate-400">
          Tip: For best reliability, use a channel URL like
          <span className="text-slate-300"> https://youtube.com/channel/UC...</span>.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
      </CardContent>
    </Card>
  );
}
