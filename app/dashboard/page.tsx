import type { Metadata } from "next";
import Link from "next/link";

import { DashboardClient } from "@/components/DashboardClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { hasPaidAccess } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard | YouTube Channel TV",
  description:
    "Manage your creator lineup and launch continuous TV-style channels from YouTube content."
};

type DashboardPageProps = {
  searchParams?: Promise<{
    unlock?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const access = await hasPaidAccess();
  const resolvedSearchParams = (await searchParams) ?? {};
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  if (!access) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="border-cyan-500/30 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-3xl text-slate-100">Unlock TV Mode</CardTitle>
            <CardDescription>
              Purchase via Stripe, then unlock this dashboard using the same checkout email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Button asChild className="w-full sm:w-auto">
              <a href={paymentLink} target="_blank" rel="noreferrer">
                Buy Access ($8/mo)
              </a>
            </Button>

            <form className="space-y-3" action="/api/channels" method="post">
              <input type="hidden" name="action" value="unlock" />
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Purchase Email</span>
                <Input name="email" type="email" required placeholder="you@domain.com" />
              </label>
              <Button variant="secondary" type="submit" className="w-full sm:w-auto">
                Unlock Dashboard
              </Button>
            </form>

            {resolvedSearchParams.unlock === "failed" ? (
              <p className="text-sm text-rose-400">
                No paid purchase was found for that email yet. Wait for webhook sync and try again.
              </p>
            ) : null}

            {resolvedSearchParams.unlock === "success" ? (
              <p className="text-sm text-emerald-400">
                Access unlocked. You can now use the full TV lineup dashboard.
              </p>
            ) : null}

            <p className="text-xs text-slate-500">
              Need context first? <Link href="/" className="text-cyan-300 hover:underline">Read the product page</Link>.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <DashboardClient />
    </main>
  );
}
