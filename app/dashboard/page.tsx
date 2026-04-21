import Link from "next/link";
import { LockKeyhole, PlayCircle, Tv2 } from "lucide-react";
import ChannelGrid from "@/components/ChannelGrid";
import ChannelSelector from "@/components/ChannelSelector";
import VerifyPurchaseForm from "@/components/VerifyPurchaseForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAccessFromServerCookies } from "@/lib/auth";
import { getChannelsForEmail } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const access = await getAccessFromServerCookies();
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  if (!access) {
    return (
      <main className="section-shell py-12">
        <Card className="mx-auto max-w-3xl border-[#2d3948] bg-[#101824]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <LockKeyhole className="h-6 w-6 text-[#58a6ff]" />
              Subscriber Access Required
            </CardTitle>
            <CardDescription>
              This dashboard is paywalled. Complete Stripe checkout, then verify your checkout email to unlock your private TV lineup.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href={paymentLink ?? ""}>
              <Button size="lg">Buy YouTube Channel TV ($8/mo)</Button>
            </a>
            <VerifyPurchaseForm />
          </CardContent>
        </Card>
      </main>
    );
  }

  const channels = await getChannelsForEmail(access.email);

  return (
    <main className="section-shell py-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-[#58a6ff]">Signed in as {access.email}</p>
          <h1 className="text-3xl font-semibold text-[#f0f6fc]">YouTube Channel TV Dashboard</h1>
          <p className="mt-2 text-[#9aa4b2]">Manage your channels and start an auto-playing stream in one tap.</p>
        </div>
        <Link href={channels.length > 0 ? "/tv/lineup" : "/dashboard"}>
          <Button disabled={channels.length === 0} size="lg" variant="outline">
            <PlayCircle className="mr-2 h-4 w-4" />
            Watch Now
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        <ChannelSelector />
        <Card className="border-[#273145] bg-[#101824]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tv2 className="h-5 w-5 text-[#58a6ff]" />
              TV Experience Settings
            </CardTitle>
            <CardDescription>
              Add creators you trust and let playback run continuously. Each lineup mixes recent uploads to keep the stream fresh.
            </CardDescription>
          </CardHeader>
        </Card>
        <ChannelGrid channels={channels} />
      </div>
    </main>
  );
}
