"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface CreateChannelResponse {
  channel: {
    id: string;
  };
}

export function ChannelCreator() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [theme, setTheme] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [lineup, setLineup] = useState("");
  const [breakEvery, setBreakEvery] = useState("3");
  const [breakDurationSec, setBreakDurationSec] = useState("90");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          description,
          theme,
          logoUrl,
          lineup,
          breakEvery: Number(breakEvery),
          breakDurationSec: Number(breakDurationSec)
        })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to create channel.");
      }

      const payload = (await response.json()) as CreateChannelResponse;
      router.push(`/channel/${payload.channel.id}`);
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to create channel.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Wand2 className="h-5 w-5 text-cyan-300" />
          Create a New Channel
        </CardTitle>
        <CardDescription>
          Paste YouTube links in order. Optional duration override uses: URL | minutes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Channel name (e.g., 90s Music TV)"
            />
            <Input
              required
              value={theme}
              onChange={(event) => setTheme(event.target.value)}
              placeholder="Visual theme (e.g., Neon retro)"
            />
          </div>
          <Textarea
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What type of channel experience are you creating?"
          />
          <Input
            value={logoUrl}
            onChange={(event) => setLogoUrl(event.target.value)}
            placeholder="Optional logo URL (auto-fills from first video thumbnail if empty)"
          />
          <Textarea
            required
            value={lineup}
            onChange={(event) => setLineup(event.target.value)}
            className="min-h-40"
            placeholder={[
              "https://www.youtube.com/watch?v=dQw4w9WgXcQ | 4",
              "https://www.youtube.com/watch?v=oRdxUFDoQe0 | 6",
              "https://www.youtube.com/watch?v=9bZkp7q19f0"
            ].join("\n")}
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              type="number"
              min={1}
              max={8}
              value={breakEvery}
              onChange={(event) => setBreakEvery(event.target.value)}
              placeholder="Insert break every N videos"
            />
            <Input
              type="number"
              min={15}
              max={300}
              value={breakDurationSec}
              onChange={(event) => setBreakDurationSec(event.target.value)}
              placeholder="Commercial break duration (seconds)"
            />
          </div>
          {error && <p className="text-sm text-pink-300">{error}</p>}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Build Channel
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
