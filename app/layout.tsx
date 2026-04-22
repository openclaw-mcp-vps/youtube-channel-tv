import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";

import "@/app/globals.css";

const headingFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://youtube-channel-tv.example"),
  title: "YouTube Channel TV | Lean-Back YouTube Like Cable",
  description:
    "Turn your favorite YouTube creators into continuous TV-style channels. Press play once and watch without decision fatigue.",
  openGraph: {
    title: "YouTube Channel TV",
    description:
      "Continuous YouTube channel streams for people who want to relax without endless video choices.",
    url: "https://youtube-channel-tv.example",
    siteName: "YouTube Channel TV",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "YouTube Channel TV",
    description:
      "Make YouTube feel like old-school TV with autoplay channel lineups."
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${headingFont.variable} ${bodyFont.variable} dark`}>
      <body className="grid-fade antialiased">{children}</body>
    </html>
  );
}
