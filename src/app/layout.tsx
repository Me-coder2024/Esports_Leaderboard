import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tournament Scoreboard — Free Fire & BGMI Esports",
  description:
    "Live tournament scoring and leaderboards for Free Fire and BGMI esports events. Powered by Parul University & Lakshya 2047.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{
          fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
