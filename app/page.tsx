import Link from "next/link";
import { Clock3, Layers, Tv, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How is this different from a normal YouTube playlist?",
    answer:
      "YouTube Channel TV turns playlists into always-on channels with TV timing, branded identity, and a live-style program guide instead of a static list."
  },
  {
    question: "Do viewers need an account to watch channels?",
    answer:
      "Only channel owners need a paid account. You can share your channel URL with viewers who just want to tune in."
  },
  {
    question: "How do commercial breaks work?",
    answer:
      "You choose break frequency and break duration when creating a channel. The scheduler inserts breaks automatically as part of the 24/7 loop."
  },
  {
    question: "When do I get access after purchasing?",
    answer:
      "Checkout completes through Stripe Payment Link. Once Stripe webhook confirms payment, unlock the dashboard using the same checkout email."
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-transparent text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-20 pt-16">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-4 py-1 text-xs uppercase tracking-[0.2em] text-cyan-300">
          Turn YouTube into actual TV channels
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <h1 className="text-5xl leading-[1.05] tracking-tight sm:text-6xl">
              Build always-on YouTube channels that feel like real TV.
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              Launch themed channels in minutes with continuous playback, program scheduling,
              commercial-style breaks, and a viewer chat panel.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer">
                  Start for $8/mo
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/unlock">I already purchased</Link>
              </Button>
            </div>
            <p className="text-sm text-slate-400">Hosted checkout through Stripe Payment Link. No custom billing flow.</p>
          </div>

          <Card className="border-cyan-400/30 bg-gradient-to-b from-slate-900/80 to-slate-950/90">
            <CardHeader>
              <CardTitle className="text-2xl">What you get</CardTitle>
              <CardDescription>Designed for creators, communities, and niche curators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-200">
              <div className="flex items-start gap-3">
                <Tv className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p>Branded channel pages with logos, now-playing overlays, and TV-style continuity.</p>
              </div>
              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p>24/7 schedule engine that calculates live position and upcoming guide slots.</p>
              </div>
              <div className="flex items-start gap-3">
                <Layers className="mt-0.5 h-4 w-4 text-cyan-300" />
                <p>Commercial-break automation to preserve pacing and create channel rhythm.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Problem</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            Playlists are passive. They have no identity, no pacing, and no shared viewing experience.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Solution</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            Channelize YouTube content into a structured stream with guide data and channel personality.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The Result</CardTitle>
          </CardHeader>
          <CardContent className="text-slate-300">
            Fans tune in like a station, not a playlist. Session length and repeat visits increase.
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <Card className="border-cyan-400/30 bg-slate-950/80">
          <CardHeader>
            <CardTitle className="text-3xl">Pricing</CardTitle>
            <CardDescription>One simple creator plan.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-5xl font-semibold">$8<span className="text-xl text-slate-400">/month</span></p>
              <p className="max-w-xl text-sm text-slate-300">
                Unlimited channel creation, viewer-ready channel pages, program guides, and scheduling controls.
              </p>
            </div>
            <Button asChild size="lg">
              <a href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK} target="_blank" rel="noreferrer">
                Buy Now
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="mb-6 text-3xl font-semibold">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="rounded-xl border border-slate-700 bg-slate-900/50 p-4">
              <summary className="cursor-pointer text-lg font-medium">{faq.question}</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800/80 px-6 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-sm text-slate-400">
          <p>YouTube Channel TV</p>
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span>Stripe-hosted checkout</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
