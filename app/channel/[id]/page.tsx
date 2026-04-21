import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { ChannelPlayer } from "@/components/ChannelPlayer";
import { ProgramGuide } from "@/components/ProgramGuide";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChannelById } from "@/lib/database";
import { requirePaidAccess } from "@/lib/paywall";
import { buildBroadcastLineup, buildProgramGuide, getPlaybackState } from "@/lib/schedule";
import { notFound } from "next/navigation";

interface ChannelPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params;
  await requirePaidAccess(`/channel/${id}`);

  const channel = await getChannelById(id);

  if (!channel) {
    notFound();
  }

  const lineup = buildBroadcastLineup(channel);
  const playbackState = getPlaybackState(lineup, channel.createdAt);
  const guide = buildProgramGuide(lineup, channel.createdAt, 12);

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-700">
              <Image src={channel.logoUrl} alt={channel.name} fill className="object-cover" />
            </div>
            <div>
              <h1 className="text-3xl">{channel.name}</h1>
              <p className="text-sm text-slate-300">{channel.description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{channel.theme}</Badge>
          <Badge variant="muted">{channel.programs.length} Videos</Badge>
        </div>
      </header>

      <ChannelPlayer
        channelId={channel.id}
        channelName={channel.name}
        lineup={lineup}
        initialIndex={playbackState.index}
        initialOffsetSec={playbackState.offsetSec}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="h-5 w-5 text-cyan-300" />
            Upcoming Programming
          </CardTitle>
          <Badge variant="muted">Auto-updates every page load</Badge>
        </CardHeader>
        <CardContent>
          <ProgramGuide items={guide} />
        </CardContent>
      </Card>
    </main>
  );
}
