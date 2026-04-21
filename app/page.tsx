import Link from "next/link";
import { CheckCircle2, CirclePlay, Gauge, ListVideo, Tv2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const faqs = [
  {
    question: "How is this different from YouTube playlists?",
    answer:
      "Playlists are still manual. YouTube Channel TV auto-builds a rotating queue from multiple creators, then keeps going like a live channel feed."
  },
  {
    question: "Does it work with family routines and background viewing?",
    answer:
      "Yes. It is designed for low-effort viewing: start the stream, switch channels when needed, and let it run while you cook, tidy up, or unwind."
  },
  {
    question: "Do I need to pick videos every time?",
    answer:
      "No. You choose creators once, save your lineup, and playback continues automatically without constant clicks."
  },
  {
    question: "How do I unlock premium access after payment?",
    answer:
      "Buy through Stripe, then use the unlock step inside your dashboard with the same email address you used at checkout."
  }
];

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <div className="space-y-16">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <Badge>Entertainment Tools</Badge>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 md:text-5xl">
            Turn YouTube Into Actual TV Channels
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-300">
            Build a lineup from your favorite creators and watch passively like cable TV. No endless browsing,
            no algorithm rabbit holes, and no decision fatigue after a long day.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="min-w-40">
              <Link href="/login">Start Free Setup</Link>
            </Button>
            <a
              href={paymentLink}
              className="inline-flex min-h-12 min-w-40 items-center justify-center rounded-md bg-white/5 px-6 py-3 text-base font-semibold text-zinc-100 transition-colors hover:bg-white/10"
            >
              Buy for $8/mo
            </a>
          </div>
          <p className="text-sm text-zinc-400">
            Built for busy professionals and parents who want quality background entertainment without mental overhead.
          </p>
        </div>

        <Card className="relative overflow-hidden border-cyan-400/20">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2">
              <Tv2 className="h-5 w-5 text-cyan-300" />
              Tonight&apos;s Lean-Back Stack
            </CardTitle>
            <CardDescription>Auto-built lineup from the channels you trust most.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3 text-sm">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-200">7:00 PM • Home Repairs Channel</div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-200">7:24 PM • Parenting & Family Stories</div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-200">7:51 PM • Slow Cooking & Kitchen TV</div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-zinc-200">8:19 PM • Design + Productivity Deep Dive</div>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5 text-cyan-300" />
              The Real Problem
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-300">
            YouTube is great content with terrible unwind UX. Every session starts with a decision tree instead of instant comfort.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ListVideo className="h-5 w-5 text-cyan-300" />
              The Solution
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-300">
            Channel lineups become rotating streams. One tap starts playback, and the next video is always ready.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CirclePlay className="h-5 w-5 text-cyan-300" />
              Daily Outcome
            </CardTitle>
          </CardHeader>
          <CardContent className="text-zinc-300">
            Background entertainment that feels predictable, calm, and effortless, exactly like old-school TV but with modern creators.
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Production-ready flow from signup to passive viewing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-zinc-300">
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />Sign in and search for YouTube channels you already trust.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />Arrange your lineup order to control round-robin playback.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />Unlock premium and launch your personal TV stream instantly.</p>
            <p className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-300" />Switch channels anytime with remote-style controls and a live guide.</p>
          </CardContent>
        </Card>

        <Card className="border-cyan-400/20">
          <CardHeader>
            <CardTitle>Simple Pricing</CardTitle>
            <CardDescription>One plan designed for daily use.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="text-4xl font-bold text-zinc-100">$8<span className="text-xl text-zinc-400">/mo</span></p>
              <p className="mt-2 text-sm text-zinc-300">
                Unlimited channel lineups, continuous TV mode, and paywall-protected access.
              </p>
            </div>
            <a
              href={paymentLink}
              className="inline-flex w-full items-center justify-center rounded-md bg-cyan-500 px-4 py-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-400"
            >
              Buy Now on Stripe
            </a>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-100">FAQ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-zinc-300">{faq.answer}</CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
