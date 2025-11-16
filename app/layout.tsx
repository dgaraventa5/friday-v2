import type { Metadata } from "next";
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SupabaseProvider } from '@/lib/supabase/provider';
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Friday - Focus on What Matters Most",
  description: "Prioritize your daily tasks using proven productivity principles. Achieve more with less stress.",
  generator: 'v0.app'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
        <Analytics />
      </body>
    </html>
  );
}
