import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Lock, PlayCircle, ShieldCheck } from "lucide-react";
import { ChannelSelector } from "@/components/ChannelSelector";
import { ClaimAccessForm } from "@/components/ClaimAccessForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ACCESS_COOKIE_NAME, auth, verifyAccessToken } from "@/lib/auth";
import { getLineup } from "@/lib/db";
import { getChannelsByIds, type YouTubeChannel } from "@/lib/youtube";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Create your personal YouTube channel lineup for continuous TV-style watching."
};

function hydrateFallbackChannels(channelIds: string[]): YouTubeChannel[] {
  return channelIds.map((id) => ({
    id,
    title: `Channel ${id.slice(-6)}`,
    description: "",
    thumbnailUrl: ""
  }));
}

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const hasAccess = verifyAccessToken(cookieStore.get(ACCESS_COOKIE_NAME)?.value, email);
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  const lineupIds = await getLineup(email);

  let channels: YouTubeChannel[] = [];
  if (lineupIds.length > 0) {
    try {
      const fetched = await getChannelsByIds(lineupIds);
      const byId = new Map(fetched.map((channel) => [channel.id, channel]));
      channels = lineupIds
        .map((id) => byId.get(id) ?? hydrateFallbackChannels([id])[0])
        .filter((channel): channel is YouTubeChannel => Boolean(channel));
    } catch {
      channels = hydrateFallbackChannels(lineupIds);
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
        <div className="space-y-2">
          <Badge variant={hasAccess ? "default" : "muted"}>{hasAccess ? "Premium Unlocked" : "Locked"}</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Your TV Control Room</h1>
          <p className="max-w-2xl text-zinc-300">
            Curate your creator channels once, keep the queue fresh, and switch to passive viewing whenever you need to decompress.
          </p>
        </div>

        {hasAccess ? (
          <Button asChild size="lg">
            <Link href="/tv">
              <PlayCircle className="mr-2 h-5 w-5" />
              Open TV Mode
            </Link>
          </Button>
        ) : null}
      </section>

      {!hasAccess ? (
        <Card className="border-cyan-400/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-cyan-300" />
              Unlock Full TV Streaming
            </CardTitle>
            <CardDescription>
              You are signed in. Purchase once, then claim access with the same checkout email to activate TV mode.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <a
                href={paymentLink}
                className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-500 px-4 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
              >
                Buy Access - $8/mo
              </a>
              <p className="text-sm text-zinc-300">
                After checkout, come back here and run the unlock step to set your access cookie.
              </p>
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-xs text-zinc-400">
                <p className="font-semibold text-zinc-200">Secure model</p>
                <p className="mt-1">Webhook-confirmed purchases are required before access is granted.</p>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-zinc-200">Already paid? Claim access:</p>
              <ClaimAccessForm email={email} />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-cyan-300" />
              Access Active
            </CardTitle>
            <CardDescription>
              Your account is unlocked. Update your lineup any time and jump straight into TV mode.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <ChannelSelector initialChannels={channels} canEdit={hasAccess} />
    </div>
  );
}
