import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "URBAN RUSH - Endless Runner 3D",
  description: "Fast-paced 3D endless runner game! Dodge obstacles, collect coins, and run through the urban cityscape. Swipe or use keyboard to survive!",
  keywords: ["game", "endless runner", "3D game", "subway surfers", "runner game", "browser game"],
  authors: [{ name: "URBAN RUSH" }],
  openGraph: {
    title: "URBAN RUSH - Endless Runner 3D",
    description: "Fast-paced 3D endless runner game! Dodge obstacles, collect coins, survive!",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white overflow-hidden`}
        style={{ margin: 0, padding: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
