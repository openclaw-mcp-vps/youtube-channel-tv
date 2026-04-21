"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

import type { YouTubeChannel } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type ChannelSelectorProps = {
  initialChannels: YouTubeChannel[];
};

type RequestState = {
  message: string;
  type: "idle" | "error" | "success";
};

export default function ChannelSelector({ initialChannels }: ChannelSelectorProps) {
  const [channels, setChannels] = useState<YouTubeChannel[]>(initialChannels);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchResult, setSearchResult] = useState<YouTubeChannel | null>(null);
  const [status, setStatus] = useState<RequestState>({ message: "", type: "idle" });

  const canAddResult = useMemo(() => {
    if (!searchResult) {
      return false;
    }

    return !channels.some((channel) => channel.id === searchResult.id);
  }, [channels, searchResult]);

  async function lookupChannel() {
    if (!query.trim()) {
      return;
    }

    setLoading(true);
    setStatus({ message: "", type: "idle" });

    try {
      const response = await fetch(`/api/youtube?input=${encodeURIComponent(query)}`);
      const payload = (await response.json()) as { error?: string; channel?: YouTubeChannel };

      if (!response.ok || !payload.channel) {
        throw new Error(payload.error || "Unable to fetch channel.");
      }

      setSearchResult(payload.channel);
      setStatus({
        message: `Loaded ${payload.channel.title}. Review it, then add it to your lineup.`,
        type: "success"
      });
    } catch (error) {
      setSearchResult(null);
      setStatus({
        message: error instanceof Error ? error.message : "Unable to fetch channel.",
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  }

  function addChannel() {
    if (!searchResult) {
      return;
    }

    setChannels((current) => [...current, searchResult]);
    setSearchResult(null);
    setQuery("");
    setStatus({ message: "Channel added. Save lineup to apply it in TV mode.", type: "success" });
  }

  function removeChannel(channelId: string) {
    setChannels((current) => current.filter((channel) => channel.id !== channelId));
  }

  function moveChannel(channelId: string, direction: "up" | "down") {
    setChannels((current) => {
      const index = current.findIndex((channel) => channel.id === channelId);
      if (index < 0) {
        return current;
      }

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  async function saveLineup() {
    setSaving(true);
    setStatus({ message: "", type: "idle" });

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ channels })
      });

      const payload = (await response.json()) as { error?: string; channels?: YouTubeChannel[] };
      if (!response.ok) {
        throw new Error(payload.error || "Unable to save channel lineup.");
      }

      setStatus({
        message: `Saved ${payload.channels?.length ?? channels.length} channels. TV mode is ready.`,
        type: "success"
      });
    } catch (error) {
      setStatus({
        message: error instanceof Error ? error.message : "Unable to save channel lineup.",
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build Your TV Lineup</CardTitle>
          <CardDescription>
            Paste a YouTube channel URL, channel ID, handle, or creator name to add it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="https://youtube.com/@creator or UCxxxx"
            />
            <Button onClick={lookupChannel} disabled={loading || query.trim().length === 0}>
              <Plus className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Find Channel"}
            </Button>
          </div>

          {searchResult ? (
            <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3">
              <p className="font-medium text-cyan-100">{searchResult.title}</p>
              <p className="line-clamp-2 text-sm text-cyan-200/80">{searchResult.description || "No channel description."}</p>
              <p className="mt-1 text-xs text-cyan-200/70">{searchResult.videos.length} recent videos loaded</p>
              <Button className="mt-3" size="sm" onClick={addChannel} disabled={!canAddResult}>
                Add to Lineup
              </Button>
            </div>
          ) : null}

          {status.message ? (
            <p className={`text-sm ${status.type === "error" ? "text-red-300" : "text-cyan-200"}`}>{status.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Channel Order</CardTitle>
          <CardDescription>The order below becomes your channel guide in TV mode.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {channels.length === 0 ? (
            <p className="text-sm text-slate-400">No channels yet. Add at least one channel to enable TV mode.</p>
          ) : null}

          {channels.map((channel, index) => (
            <div key={channel.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950/50 p-3">
              <div className="min-w-8 text-xs font-semibold text-slate-400">CH {String(index + 1).padStart(2, "0")}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-slate-100">{channel.title}</p>
                <p className="truncate text-xs text-slate-400">{channel.videos.length} queued videos</p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => moveChannel(channel.id, "up")}> 
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => moveChannel(channel.id, "down")}> 
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button variant="danger" size="sm" onClick={() => removeChannel(channel.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <Button onClick={saveLineup} disabled={saving || channels.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Lineup"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
