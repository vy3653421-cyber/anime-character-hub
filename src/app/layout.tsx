import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anime Character Hub",
  description: "A cinematic archive for anime characters, abilities and worlds.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
