import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ArrowLeft, Tv2 } from "lucide-react";
import { TVPlayer } from "@/components/TVPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, auth, verifyAccessToken } from "@/lib/auth";
import { getLineup } from "@/lib/db";
import { getChannelsByIds, type YouTubeChannel } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "TV Mode",
  description: "Watch your creator lineup as a continuous TV-style stream."
};

function toFallbackChannels(channelIds: string[]): YouTubeChannel[] {
  return channelIds.map((id) => ({
    id,
    title: `Channel ${id.slice(-6)}`,
    description: "",
    thumbnailUrl: ""
  }));
}

export default async function TVPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const hasAccess = verifyAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value, email);

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const lineupIds = await getLineup(email);

  if (lineupIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv2 className="h-5 w-5 text-cyan-300" />
            No Channels Yet
          </CardTitle>
          <CardDescription>
            Add at least one channel in your dashboard before launching TV mode.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back To Dashboard
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  let channels: YouTubeChannel[] = [];

  try {
    const fetched = await getChannelsByIds(lineupIds);
    const byId = new Map(fetched.map((channel) => [channel.id, channel]));
    channels = lineupIds.map((id) => byId.get(id) ?? toFallbackChannels([id])[0]);
  } catch {
    channels = toFallbackChannels(lineupIds);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100">TV Mode</h1>
        <Button asChild variant="secondary">
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      <TVPlayer channels={channels} />
    </div>
  );
}
