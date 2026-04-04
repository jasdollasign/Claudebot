import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoL Replay Coach - AI-Powered Game Analysis",
  description:
    "Upload your League of Legends replays and get AI coaching analysis with actionable tips to improve your gameplay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
