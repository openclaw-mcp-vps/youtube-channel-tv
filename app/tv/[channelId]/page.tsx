import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { TVPlayer } from "@/components/TVPlayer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerIdentity, hasPaidAccess } from "@/lib/auth";
import { getUserChannels } from "@/lib/db";
import { fetchChannelProfile, fetchChannelVideos } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "TV Mode | YouTube Channel TV",
  description: "Watch a continuous stream of videos from your selected creator channels."
};

type TVPageProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export default async function TVChannelPage({ params }: TVPageProps) {
  const access = await hasPaidAccess();

  if (!access) {
    redirect("/dashboard");
  }

  const { channelId } = await params;

  const [channel, videos] = await Promise.all([
    fetchChannelProfile(channelId).catch(() => null),
    fetchChannelVideos(channelId, 40).catch(() => [])
  ]);

  if (!channel || videos.length === 0) {
    notFound();
  }

  const viewer = await getViewerIdentity();
  const lineup = viewer.userKey ? await getUserChannels(viewer.userKey) : [channel];

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/75 p-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>TV Mode</Badge>
            <Badge variant="secondary">Autoplay On</Badge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-100">{channel.title}</h1>
          <p className="max-w-3xl text-sm text-slate-400">
            Press play once and let the channel run. Videos auto-advance continuously.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Back to Dashboard</Link>
        </Button>
      </header>

      <TVPlayer channel={channel} videos={videos} lineup={lineup.length > 0 ? lineup : [channel]} />

      <Card className="border-slate-800 bg-slate-900/65">
        <CardHeader>
          <CardTitle className="text-lg">What makes this TV-like?</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-300">
          This channel loops through creator uploads in sequence and auto-advances without
          returning to browsing. Add more channels in the dashboard and surf between them anytime.
        </CardContent>
      </Card>
    </main>
  );
}
