import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppAuth } from "@/components/app-auth";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

/** Every page reads the live database. Never bake a batch/video id in at build. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Studio",
  description: "The UGC production machine: content, deals, systems.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen bg-ink font-sans antialiased">
        <AppAuth>{children}</AppAuth>
      </body>
    </html>
  );
}
