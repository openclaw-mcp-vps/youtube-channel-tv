import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TVPlayer from "@/components/TVPlayer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessFromServerCookies } from "@/lib/auth";
import { getChannelsForEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

type TVPageProps = {
  params: Promise<{
    channelId: string;
  }>;
};

export default async function TVPage({ params }: TVPageProps) {
  const resolvedParams = await params;
  const access = await getAccessFromServerCookies();
  if (!access) {
    redirect("/dashboard");
  }

  const channels = await getChannelsForEmail(access.email);

  if (channels.length === 0) {
    return (
      <main className="section-shell py-12">
        <Card>
          <CardHeader>
            <CardTitle>No Channels Configured</CardTitle>
            <CardDescription>Add at least one channel before opening TV mode.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const isLineup = resolvedParams.channelId === "lineup";
  const selectedChannel = channels.find((channel) => channel.channelId === resolvedParams.channelId);

  if (!isLineup && !selectedChannel) {
    notFound();
  }

  const headline = isLineup ? "Your Full Lineup" : selectedChannel!.title;
  const channelIds = isLineup ? channels.map((channel) => channel.channelId) : [selectedChannel!.channelId];

  return (
    <main className="section-shell py-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#58a6ff]">TV Mode</p>
          <h1 className="text-3xl font-semibold text-[#f0f6fc]">{headline}</h1>
        </div>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>

      <TVPlayer channelIds={channelIds} headline={headline} />
    </main>
  );
}
