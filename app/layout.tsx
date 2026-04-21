import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Sans } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-channel-tv.vercel.app"),
  title: {
    default: "YouTube Channel TV",
    template: "%s | YouTube Channel TV"
  },
  description:
    "Turn YouTube into real TV channels. Build a creator lineup and watch continuously without endless decision fatigue.",
  keywords: [
    "YouTube TV channels",
    "continuous YouTube playback",
    "passive YouTube watching",
    "creator lineup",
    "background entertainment"
  ],
  openGraph: {
    title: "YouTube Channel TV",
    description:
      "Build a personal TV guide from YouTube creators and let it play like cable TV with zero decision overhead.",
    url: "https://youtube-channel-tv.vercel.app",
    siteName: "YouTube Channel TV",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel TV",
    description:
      "Turn choice-heavy YouTube into a lean-back TV experience with continuous channels built from creators you trust."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${ibmPlexSans.variable} antialiased`}>{children}</body>
    </html>
  );
}
