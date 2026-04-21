"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChannelSelector() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!query.trim()) {
      setError("Enter a channel URL, @handle, or channel ID.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/channels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action: "add", query })
      });

      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not add this channel.");
        return;
      }

      setSuccess("Channel added. Your lineup is ready to watch.");
      setQuery("");
      router.refresh();
    } catch {
      setError("Network error while adding the channel.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Search className="h-5 w-5 text-[#58a6ff]" />
          Build Your TV Lineup
        </CardTitle>
        <CardDescription>Add creators by URL, @handle, or channel ID. We convert them into a hands-free stream.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-3 sm:flex-row" onSubmit={onSubmit}>
          <input
            className="h-11 flex-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3 text-sm text-[#e6edf3] outline-none ring-[#58a6ff] placeholder:text-[#6e7681] focus:ring-2"
            placeholder="Example: https://youtube.com/@mkbhd"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button disabled={saving} type="submit">
            <Plus className="mr-2 h-4 w-4" />
            {saving ? "Adding..." : "Add Channel"}
          </Button>
        </form>
        {error ? <p className="mt-3 text-sm text-[#ff7b72]">{error}</p> : null}
        {success ? <p className="mt-3 text-sm text-[#3fb950]">{success}</p> : null}
      </CardContent>
    </Card>
  );
}
