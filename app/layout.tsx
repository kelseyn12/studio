import type { Metadata } from "next";
import { Geist } from "next/font/google";
import localFont from "next/font/local";
import { AppAuth } from "@/components/app-auth";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const tiktokSans = localFont({ src: "../fonts/TikTokSans-Bold.ttf", variable: "--font-tiktok", weight: "700" });
const igType = localFont({ src: "../fonts/InterTight-SemiBold.ttf", variable: "--font-ig", weight: "600" });

/** Every page reads the live database. Never bake a batch/video id in at build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Studio",
  description: "The UGC production machine: content, deals, systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${tiktokSans.variable} ${igType.variable}`}>
      <body className="min-h-screen bg-ink font-sans antialiased">
        <AppAuth>{children}</AppAuth>
      </body>
    </html>
  );
}
