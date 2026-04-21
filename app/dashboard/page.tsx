import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AccessClaimForm from "@/components/AccessClaimForm";
import ChannelSelector from "@/components/ChannelSelector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, signOut } from "@/lib/auth";
import { getLineupByEmail } from "@/lib/storage";
import { hasActiveAccess } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const hasAccess = hasActiveAccess(cookieStore, email);
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  if (!hasAccess) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-5 pb-16 pt-12 sm:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Unlock TV Mode</CardTitle>
            <CardDescription>
              Your account is signed in as {email}. Complete checkout, then verify your purchase email to unlock.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href={paymentLink ?? ""} target="_blank" rel="noreferrer">
              <Button size="lg">Buy for $8/mo</Button>
            </Link>
            <p className="text-sm text-slate-300">
              If you already paid, use the same email you entered during Stripe checkout.
            </p>
            <AccessClaimForm defaultEmail={email} />
            <form action={handleSignOut}>
              <Button variant="ghost" size="sm">
                Sign Out
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  const lineup = await getLineupByEmail(email);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 pb-16 pt-10 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-cyan-300">Dashboard</p>
          <h1 className="text-3xl font-bold">Build Your Channel TV</h1>
          <p className="text-sm text-slate-300">Signed in as {email}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/tv">
            <Button>Watch TV</Button>
          </Link>
          <form action={handleSignOut}>
            <Button variant="secondary">Sign Out</Button>
          </form>
        </div>
      </header>

      <ChannelSelector initialChannels={lineup.channels} />
    </main>
  );
}
