import Link from "next/link";
import { CheckCircle2, Clock3, PlaySquare, Tv2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "How is this different from a normal YouTube playlist?",
    answer:
      "A playlist still makes you choose what to queue and when to switch creators. YouTube Channel TV builds a rotating lineup from your selected channels and auto-advances forever."
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. It runs in your browser on desktop and mobile. Add your channels once, then open your TV route whenever you want passive viewing."
  },
  {
    question: "Will this replace my YouTube account?",
    answer:
      "No. It uses public channel feeds through the YouTube Data API and gives you a calmer front-end experience focused on lean-back watching."
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. Billing is month-to-month at $8 and cancellation takes effect at the next cycle."
  }
];

export default function HomePage() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <main className="pb-20">
      <section className="section-shell pt-14 sm:pt-20">
        <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-[#30363d] bg-[#121824] px-4 py-2 text-sm text-[#9ecbff]">
              <Tv2 className="h-4 w-4" />
              Entertainment Tool for Busy Households
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-[#f0f6fc] sm:text-5xl">
              Turn YouTube into actual TV channels.
            </h1>
            <p className="max-w-2xl text-lg text-[#9aa4b2]">
              Build a lineup from your favorite creators and watch continuously without choosing every next video. No algorithm rabbit holes. No decision fatigue. Just press play and unwind.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a href={paymentLink ?? ""}>
                <Button className="w-full sm:w-auto" size="lg">
                  Start for $8/mo
                </Button>
              </a>
              <Link href="/dashboard">
                <Button className="w-full sm:w-auto" size="lg" variant="outline">
                  Open Dashboard
                </Button>
              </Link>
            </div>
            <div className="grid gap-3 text-sm text-[#9aa4b2] sm:grid-cols-3">
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
                Mobile-ready
              </p>
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
                Hosted Stripe checkout
              </p>
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#3fb950]" />
                Private channel lineup
              </p>
            </div>
          </div>

          <Card className="border-[#263140] bg-[#111726]">
            <CardHeader>
              <CardTitle className="text-2xl">What viewers get</CardTitle>
              <CardDescription>Designed for after-work decompression and background entertainment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-[#c0cad8]">
              <p className="inline-flex items-start gap-2">
                <Clock3 className="mt-0.5 h-4 w-4 text-[#58a6ff]" />
                Save mental energy by removing constant content decisions.
              </p>
              <p className="inline-flex items-start gap-2">
                <PlaySquare className="mt-0.5 h-4 w-4 text-[#58a6ff]" />
                Auto-advance through fresh videos from channels you actually trust.
              </p>
              <p className="inline-flex items-start gap-2">
                <Zap className="mt-0.5 h-4 w-4 text-[#58a6ff]" />
                Keep content quality high while ditching engagement-bait recommendations.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="section-shell mt-20 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>The Problem</CardTitle>
            <CardDescription>Choice overload kills the relaxing part of YouTube.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-[#c0cad8]">
            <p>
              After work, you do not want to curate a queue for 30 minutes. You want the effortless cable-TV feeling where content simply flows.
            </p>
            <p>
              YouTube optimizes for engagement, not comfort. It keeps pushing you to click, compare thumbnails, and second-guess every choice.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>The Solution</CardTitle>
            <CardDescription>Your favorite channels become a passive stream.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-[#c0cad8]">
            <p>
              Pick creators once, then watch continuously with automatic transitions between videos. No searching, no tab-hopping, no endless scrolling.
            </p>
            <p>
              It is a low-friction viewing mode built for professionals and parents who want background entertainment without cognitive overhead.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="section-shell mt-20">
        <Card className="border-[#244159] bg-[#101b2b]">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
            <CardDescription>Simple, predictable, and built for daily use.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-4xl font-semibold text-[#f0f6fc]">$8/mo</p>
              <p className="text-sm text-[#9aa4b2]">Unlimited channel lineups, continuous auto-play, mobile + desktop access.</p>
            </div>
            <a href={paymentLink ?? ""}>
              <Button size="lg">Buy Access</Button>
            </a>
          </CardContent>
        </Card>
      </section>

      <section className="section-shell mt-20">
        <h2 className="mb-6 text-3xl font-semibold text-[#f0f6fc]">FAQ</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {faqs.map((faq) => (
            <Card key={faq.question}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#9aa4b2]">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
