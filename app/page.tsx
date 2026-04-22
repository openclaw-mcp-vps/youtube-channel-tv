import Link from "next/link";
import { Check, Clock, PlaySquare, TvMinimal, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faq = [
  {
    q: "How is this different from YouTube autoplay?",
    a: "Autoplay stays inside one recommendation lane. YouTube Channel TV lets you curate your own creator lineup and channel-surf between them like cable."
  },
  {
    q: "Do I need a YouTube API key?",
    a: "You can start with channel feed fallback, but adding a YouTube API key gives faster lookups and richer metadata in your channel cards."
  },
  {
    q: "What happens after I buy?",
    a: "Stripe handles checkout. Your payment email is unlocked via webhook, then you activate access with that same email and get a persistent access cookie."
  },
  {
    q: "Can I watch on mobile?",
    a: "Yes. The dashboard and TV player are responsive and built for phones, tablets, and desktop displays."
  }
];

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? "";

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <header className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-cyan-500/5 sm:p-10">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge>Entertainment Tools</Badge>
          <Badge variant="secondary">$8/mo</Badge>
          <Badge variant="secondary">Dark Mode Native</Badge>
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-100 sm:text-5xl">
          Turn YouTube into actual TV channels.
        </h1>
        <p className="mt-5 max-w-3xl text-base text-slate-300 sm:text-lg">
          Build your own lineup from creators you trust, hit play once, and relax. No infinite
          scrolling. No decision fatigue. Just continuous, lean-back viewing.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Open Dashboard</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href={paymentLink} target="_blank" rel="noreferrer">
              Buy for $8/mo
            </a>
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Buy button opens Stripe hosted checkout directly.
        </p>
      </header>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-900/60">
          <CardHeader>
            <Clock className="size-6 text-cyan-300" />
            <CardTitle className="text-xl">The Problem</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            After work, choosing what to watch feels like work. YouTube pushes engagement loops,
            not low-effort comfort.
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60">
          <CardHeader>
            <TvMinimal className="size-6 text-cyan-300" />
            <CardTitle className="text-xl">The Solution</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            Curate channels once and watch passively. Each channel auto-advances through recent
            videos like a real TV station.
          </CardContent>
        </Card>
        <Card className="bg-slate-900/60">
          <CardHeader>
            <Zap className="size-6 text-cyan-300" />
            <CardTitle className="text-xl">Why It Works</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            Familiar creators, no choice overload, and instant continuity. It brings cable
            simplicity to YouTube quality.
          </CardContent>
        </Card>
      </section>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/65 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-slate-100 sm:text-3xl">Who Pays for This</h2>
        <p className="mt-4 max-w-3xl text-slate-300">
          Busy professionals and parents who want background entertainment without constant
          decisions. If you miss channel surfing but prefer creator-led content, this is built for
          your evening routine.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {[
            "Wind-down mode after work without browsing",
            "Family-safe creator lineup for shared spaces",
            "Passive learning channels while cooking or cleaning",
            "Focused, algorithm-light viewing experience"
          ].map((item) => (
            <div key={item} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <Check className="size-4 text-cyan-300" />
              <span className="text-sm text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-cyan-500/30 bg-slate-900/75">
          <CardHeader>
            <CardTitle className="text-2xl">Simple Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-4xl font-semibold text-slate-100">$8<span className="text-lg text-slate-400">/mo</span></p>
            <p className="text-slate-300">
              One plan. Full access to dashboard, channel lineup management, and TV playback.
            </p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2"><PlaySquare className="size-4 text-cyan-300" /> Unlimited channel lineup slots</li>
              <li className="flex items-center gap-2"><PlaySquare className="size-4 text-cyan-300" /> Continuous auto-advance playback</li>
              <li className="flex items-center gap-2"><PlaySquare className="size-4 text-cyan-300" /> Mobile + desktop responsive UI</li>
            </ul>
            <Button asChild size="lg" className="w-full sm:w-auto">
              <a href={paymentLink} target="_blank" rel="noreferrer">
                Start Watching Tonight
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-2xl">FAQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faq.map((item) => (
              <div key={item.q}>
                <h3 className="text-sm font-semibold text-slate-100">{item.q}</h3>
                <p className="mt-1 text-sm text-slate-400">{item.a}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
