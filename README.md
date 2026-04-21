# YouTube Channel TV

YouTube Channel TV turns curated YouTube videos into always-on TV-style channels.

## Features

- Landing page with conversion sections: hero, problem, solution, pricing, and FAQ
- Paid access flow with Stripe Payment Link checkout
- Cookie-based paywall for `/dashboard` and `/channel/[id]`
- Dashboard to create and manage channels
- Channel playback with continuous scheduling and commercial breaks
- Program guide with live slot + upcoming schedule
- Viewer chat panel stored locally per channel
- API routes for health checks, channels, YouTube metadata, and Stripe webhook ingestion
- Dark-only visual system (`#0d1117` background)

## Environment

Copy `.env.example` to `.env.local` and provide values:

- `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Webhook Wiring

Set Stripe webhook endpoint to:

- `POST /api/webhooks/lemonsqueezy`

The endpoint validates Stripe signatures and records `checkout.session.completed` purchases by email.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run start
```
