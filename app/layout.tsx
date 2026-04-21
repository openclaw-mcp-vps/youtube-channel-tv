import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "700"]
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "YouTube Channel TV | Turn YouTube Into TV Channels",
    template: "%s | YouTube Channel TV"
  },
  description:
    "Transform YouTube channels into continuous TV-style streams. Build your creator lineup once and watch passively without endless decision fatigue.",
  openGraph: {
    title: "YouTube Channel TV",
    description:
      "Turn creator subscriptions into effortless lean-back viewing with a personal TV guide and auto-playing channel lineup.",
    type: "website",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "YouTube Channel TV dashboard preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel TV",
    description:
      "Skip YouTube choice paralysis. Build channels once and watch like traditional TV.",
    images: ["/og-image.svg"]
  },
  keywords: [
    "YouTube TV channels",
    "passive YouTube",
    "continuous playlist",
    "creator lineup",
    "entertainment tools"
  ]
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <div className="relative min-h-screen overflow-x-hidden">
          <header className="border-b border-white/10 bg-black/20 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-100">
                YouTube Channel TV
              </Link>
              <nav className="flex items-center gap-5 text-sm text-zinc-300">
                <Link href="/dashboard" className="hover:text-cyan-300">
                  Dashboard
                </Link>
                <Link href="/tv" className="hover:text-cyan-300">
                  Watch TV
                </Link>
                <Link href="/login" className="hover:text-cyan-300">
                  Sign In
                </Link>
              </nav>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl px-5 py-8 md:py-12">{children}</main>
        </div>
      </body>
    </html>
  );
}
