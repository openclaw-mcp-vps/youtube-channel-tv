import type { Metadata } from "next";
import { Space_Grotesk, Bebas_Neue } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk"
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-channel-tv.app"),
  title: "YouTube Channel TV | Turn YouTube into Actual TV Channels",
  description:
    "Create always-on YouTube TV channels with branded playback, guide scheduling, and channel-style viewing in one dashboard.",
  openGraph: {
    title: "YouTube Channel TV",
    description:
      "Build custom 24/7 YouTube channels with branding, auto-scheduling, and program guides.",
    type: "website",
    url: "https://youtube-channel-tv.app",
    siteName: "YouTube Channel TV"
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel TV",
    description:
      "Launch themed YouTube TV channels with continuous playlists, branded visuals, and a live program guide."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${bebasNeue.variable} antialiased`}>{children}</body>
    </html>
  );
}
