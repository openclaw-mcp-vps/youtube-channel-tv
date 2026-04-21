import Link from "next/link";
import { CalendarRange, Clapperboard, Sparkles } from "lucide-react";
import { ChannelCreator } from "@/components/ChannelCreator";
import { LogoutButton } from "@/components/LogoutButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listChannels } from "@/lib/database";
import { requirePaidAccess } from "@/lib/paywall";

export default async function DashboardPage() {
  const email = await requirePaidAccess("/dashboard");
  const channels = await listChannels();

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-8 px-6 py-10">
      <header className="rounded-2xl border border-slate-700 bg-slate-900/60 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-cyan-300">Creator Dashboard</p>
            <h1 className="mt-2 text-4xl">Program Your YouTube TV Network</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Signed in as {email}. Build channels, shape scheduling cadence, and share channel URLs.
            </p>
          </div>
          <LogoutButton />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Card className="bg-slate-950/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Clapperboard className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs text-slate-400">Total Channels</p>
                <p className="text-lg font-semibold">{channels.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-950/60">
            <CardContent className="flex items-center gap-3 p-4">
              <CalendarRange className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs text-slate-400">24/7 Scheduling</p>
                <p className="text-lg font-semibold">Enabled</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-950/60">
            <CardContent className="flex items-center gap-3 p-4">
              <Sparkles className="h-5 w-5 text-cyan-300" />
              <div>
                <p className="text-xs text-slate-400">Plan</p>
                <p className="text-lg font-semibold">Creator ($8/mo)</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </header>

      <ChannelCreator />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl">Your Channels</h2>
          <Badge>{channels.length} Active</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {channels.map((channel) => (
            <Card key={channel.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-3">
                  {channel.name}
                  <Badge variant="muted">{channel.theme}</Badge>
                </CardTitle>
                <CardDescription>{channel.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3 text-sm text-slate-300">
                <p>{channel.programs.length} programs</p>
                <Button asChild size="sm">
                  <Link href={`/channel/${channel.id}`}>Watch Channel</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
