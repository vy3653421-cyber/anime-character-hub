import type { Metadata } from "next";
import "./globals.css";
import { RecentActivity } from "./components/RecentActivity";

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
      </body>
    </html>
  );
}
