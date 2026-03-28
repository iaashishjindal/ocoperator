import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OC Operator — AI Experiments",
  description: "A lab notebook for AI experiments. What we tried, what broke, what we learned.",
  openGraph: {
    title: "OC Operator — AI Experiments",
    description: "A lab notebook for AI experiments. What we tried, what broke, what we learned.",
    url: "https://ocoperator.com",
    siteName: "OC Operator",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#fafaf9] text-stone-900">
        <header className="border-b border-stone-200 bg-[#fafaf9] sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
            <Link href="/" className="font-semibold text-stone-900 tracking-tight hover:text-stone-600 transition-colors">
              OC Operator
            </Link>
            <span className="text-xs text-stone-400 font-mono">AI experiments log</span>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
          {children}
        </main>
        <footer className="border-t border-stone-200 mt-auto">
          <div className="max-w-2xl mx-auto px-6 py-6 text-center text-sm text-stone-400">
            ocoperator.com — experiments in AI, documented honestly
          </div>
        </footer>
      </body>
    </html>
  );
}
