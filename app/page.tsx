import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleHelp, PlayCircle, Tv2, Zap } from "lucide-react";

import { auth, signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function LandingPage() {
  const session = await auth();
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  async function handleSignIn(formData: FormData) {
    "use server";

    const emailValue = formData.get("email");
    const nameValue = formData.get("name");

    if (typeof emailValue !== "string" || emailValue.trim().length === 0) {
      return;
    }

    await signIn("credentials", {
      email: emailValue,
      name: typeof nameValue === "string" ? nameValue : "",
      redirectTo: "/dashboard"
    });
  }

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 pb-16 pt-10 sm:px-8">
      <header className="mb-14 flex flex-wrap items-center justify-between gap-4 fade-rise">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Tv2 className="h-5 w-5 text-cyan-300" />
          YouTube Channel TV
        </Link>

        {session?.user?.email ? (
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-cyan-300 hover:text-cyan-200">
              Open Dashboard
            </Link>
            <form action={handleSignOut}>
              <Button variant="secondary" size="sm">
                Sign Out
              </Button>
            </form>
          </div>
        ) : null}
      </header>

      <section className="grid gap-10 rounded-3xl border border-white/10 bg-[linear-gradient(130deg,rgba(34,211,238,0.16),rgba(13,17,23,0.9)_42%,rgba(245,158,11,0.14))] p-7 shadow-[0_60px_120px_rgba(0,0,0,0.45)] sm:p-10 lg:grid-cols-[1.1fr_0.9fr] fade-rise-delay">
        <div>
          <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs tracking-[0.18em] text-cyan-200">
            TURN YOUTUBE INTO TV
          </p>
          <h1 className="max-w-xl text-4xl font-bold leading-tight text-white sm:text-5xl">
            Turn YouTube into actual TV channels you can watch without thinking.
          </h1>
          <p className="mt-5 max-w-xl text-base text-slate-200 sm:text-lg">
            Build a lineup from your favorite creators. We auto-queue their latest videos into continuous channels so
            you can lean back, switch channels, and relax like classic cable.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link href={paymentLink ?? ""} target="_blank" rel="noreferrer">
              <Button size="lg">
                Buy for $8/mo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="secondary" size="lg">
                Open Dashboard
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-xs text-slate-300">One subscription. Unlimited channels. Cancel anytime.</p>
        </div>

        <Card className="border-white/15 bg-slate-950/70">
          <CardHeader>
            <CardTitle>{session?.user?.email ? "You are signed in" : "Sign In To Start"}</CardTitle>
            <CardDescription>
              Use your email to save channel lineups and unlock your TV mode after purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session?.user?.email ? (
              <div className="space-y-4">
                <p className="text-sm text-slate-300">Signed in as {session.user.email}</p>
                <Link href="/dashboard">
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              </div>
            ) : (
              <form action={handleSignIn} className="space-y-3">
                <Input name="name" placeholder="Name (optional)" />
                <Input type="email" name="email" placeholder="you@company.com" required />
                <Button type="submit" className="w-full">
                  Continue
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Problem</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              YouTube rewards constant clicking. After work, that endless decision loop turns entertainment into effort.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Solution</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              Channel TV auto-queues creator content into passive streams, so you can watch continuously with zero
              playlist micromanagement.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Who It Helps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">
              Busy professionals and parents who want background viewing and familiar creators without cognitive load.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-5 md:grid-cols-3">
        {[
          {
            title: "Lean-back playback",
            body: "Videos continue automatically so you can stop deciding every few minutes.",
            icon: PlayCircle
          },
          {
            title: "Custom channel guide",
            body: "Create your own channel order from creators you already trust and enjoy.",
            icon: Zap
          },
          {
            title: "Fast channel switching",
            body: "Jump between creators with channel buttons, not browser tabs and watch queues.",
            icon: Tv2
          }
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-200">
                <item.icon className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Pricing</CardTitle>
            <CardDescription>Simple subscription. No tiers, no upsells, no algorithm games.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">$8<span className="text-lg text-slate-300">/month</span></p>
            <ul className="mt-4 space-y-2 text-sm text-slate-200">
              {[
                "Unlimited personal channel lineups",
                "Continuous TV-style playback",
                "Channel guide and quick switching",
                "Webhook-based purchase access"
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link href={paymentLink ?? ""} target="_blank" rel="noreferrer" className="mt-5 inline-block">
              <Button size="lg">Start Watching Smarter</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div>
              <p className="flex items-center gap-2 font-medium text-slate-100">
                <CircleHelp className="h-4 w-4 text-cyan-300" />
                Do I need a YouTube Premium account?
              </p>
              <p className="mt-1">No. You only need public channels and a YouTube Data API key configured for the app.</p>
            </div>
            <div>
              <p className="font-medium text-slate-100">How does access unlock after payment?</p>
              <p className="mt-1">
                Stripe sends a webhook to this app, then you confirm your purchase email once to receive an access
                cookie.
              </p>
            </div>
            <div>
              <p className="font-medium text-slate-100">Can I cancel anytime?</p>
              <p className="mt-1">Yes. You manage cancellation directly through Stripe billing settings.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
