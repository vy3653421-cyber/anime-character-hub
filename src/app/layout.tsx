import type { Metadata } from "next";
import "./globals.css";
import { RecentActivity } from "./components/RecentActivity";
import { VoiceCast } from "./components/VoiceCast";

export const metadata: Metadata = {
  title: "Anime Character Hub",
  description: "A cinematic archive for anime characters, abilities and worlds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <RecentActivity />
        <VoiceCast />
      </body>
    </html>
  );
}
