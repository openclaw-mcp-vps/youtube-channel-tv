"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Search, Trash2 } from "lucide-react";
import type { YouTubeChannel } from "@/lib/youtube";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface ChannelSelectorProps {
  initialChannels: YouTubeChannel[];
  canEdit: boolean;
}

export function ChannelSelector({ initialChannels, canEdit }: ChannelSelectorProps) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<YouTubeChannel[]>([]);
  const [lineup, setLineup] = useState<YouTubeChannel[]>(initialChannels);

  const lineupIds = useMemo(() => new Set(lineup.map((channel) => channel.id)), [lineup]);

  async function handleSearch() {
    setSearchError(null);
    setStatusMessage(null);

    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);

    try {
      const response = await fetch(`/api/youtube?action=search-channels&q=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as { channels?: YouTubeChannel[]; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not search channels.");
      }

      setSearchResults(payload.channels ?? []);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Could not search channels.");
    } finally {
      setSearching(false);
    }
  }

  function addChannel(channel: YouTubeChannel) {
    setStatusMessage(null);
    if (lineupIds.has(channel.id)) return;
    setLineup((current) => [...current, channel]);
  }

  function removeChannel(channelId: string) {
    setStatusMessage(null);
    setLineup((current) => current.filter((channel) => channel.id !== channelId));
  }

  function moveChannel(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= lineup.length) return;

    setStatusMessage(null);

    setLineup((current) => {
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  async function saveLineup() {
    setSaving(true);
    setStatusMessage(null);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          channelIds: lineup.map((channel) => channel.id)
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save channel lineup.");
      }

      setStatusMessage("Lineup saved. Your TV channel order is updated.");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "Could not save lineup.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Your Channel Lineup</CardTitle>
        <CardDescription>
          Pick creators once, then channel-hop like cable TV without deciding what to watch next.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search creators or paste a channel name"
            aria-label="Search YouTube channels"
            disabled={!canEdit}
          />
          <Button onClick={handleSearch} disabled={searching || !canEdit} className="sm:w-40">
            <Search className="mr-2 h-4 w-4" />
            {searching ? "Searching..." : "Find Channels"}
          </Button>
        </div>

        {searchError ? <p className="text-sm text-red-300">{searchError}</p> : null}

        {searchResults.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {searchResults.map((channel) => (
              <div
                key={channel.id}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">{channel.title}</p>
                  <p className="truncate text-xs text-zinc-400">{channel.id}</p>
                </div>
                <Button
                  size="sm"
                  variant={lineupIds.has(channel.id) ? "secondary" : "default"}
                  onClick={() => addChannel(channel)}
                  disabled={lineupIds.has(channel.id) || !canEdit}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  {lineupIds.has(channel.id) ? "Added" : "Add"}
                </Button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-zinc-300">Current Lineup</h4>
            <Badge variant="muted">{lineup.length} channels</Badge>
          </div>

          {lineup.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/20 p-4 text-sm text-zinc-400">
              Add at least one channel to start your passive TV stream.
            </p>
          ) : (
            <div className="space-y-2">
              {lineup.map((channel, index) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">{index + 1}. {channel.title}</p>
                    <p className="truncate text-xs text-zinc-400">{channel.id}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChannel(index, -1)}
                      disabled={index === 0 || !canEdit}
                      aria-label={`Move ${channel.title} up`}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveChannel(index, 1)}
                      disabled={index === lineup.length - 1 || !canEdit}
                      aria-label={`Move ${channel.title} down`}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeChannel(channel.id)}
                      disabled={!canEdit}
                      aria-label={`Remove ${channel.title}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-zinc-400">
            Your lineup order controls the round-robin playback order in TV mode.
          </p>
          <Button onClick={saveLineup} disabled={saving || !canEdit || lineup.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Lineup"}
          </Button>
        </div>

        {statusMessage ? <p className="text-sm text-cyan-200">{statusMessage}</p> : null}
      </CardContent>
    </Card>
  );
}
