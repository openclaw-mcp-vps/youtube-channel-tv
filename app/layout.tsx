import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-channel-tv.app"),
  title: {
    default: "YouTube Channel TV | Turn YouTube Into TV Channels",
    template: "%s | YouTube Channel TV"
  },
  description:
    "Transform your favorite YouTube creators into continuous TV-style channels. Stop choosing every video and start watching passively.",
  keywords: [
    "YouTube TV channels",
    "continuous YouTube playlist",
    "background entertainment",
    "decision fatigue",
    "YouTube lineup"
  ],
  openGraph: {
    type: "website",
    url: "https://youtube-channel-tv.app",
    title: "YouTube Channel TV",
    description:
      "Turn YouTube channels into hands-free streams. Build your lineup and watch like classic TV.",
    siteName: "YouTube Channel TV"
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel TV",
    description: "Build a passive, TV-style YouTube experience in minutes."
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
