"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type RecentItem = { id: number; name: string; image: string | null };
const KEY = "anime-character-hub:recently-viewed";
const LIMIT = 8;

function readItems(): RecentItem[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((item): item is RecentItem => typeof item === "object" && item !== null && typeof (item as RecentItem).id === "number" && typeof (item as RecentItem).name === "string").slice(0, LIMIT) : [];
  } catch {
    return [];
  }
}

export function RecentActivity() {
  const pathname = usePathname();
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    const sync = () => setItems(readItems());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  useEffect(() => {
    const match = pathname.match(/^\/characters\/(\d+)$/);
    if (!match) return;
    const id = Number(match[1]);
    const load = async () => {
      try {
        const response = await fetch(`/api/characters/${id}`);
        if (!response.ok) return;
        const character = (await response.json()) as RecentItem;
        const next = [character, ...readItems().filter((item) => item.id !== id)].slice(0, LIMIT);
        window.localStorage.setItem(KEY, JSON.stringify(next));
        setItems(next);
      } catch {
        // History is optional and never blocks navigation.
      }
    };
    void load();
  }, [pathname]);

  if (pathname !== "/" || !items.length) return null;

  return (
    <section className="border-t border-white/8 bg-[#07070b] px-6 py-12 text-white md:px-12" aria-labelledby="recent-heading">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.25em] text-violet-300">Your trail</p>
            <h2 id="recent-heading" className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">Recently viewed <Clock3 size={18} className="text-white/35" /></h2>
          </div>
          <span className="text-[10px] uppercase tracking-[.18em] text-white/25">Local history</span>
        </div>
        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 snap-x">
          {items.map((item) => (
            <Link key={item.id} href={`/characters/${item.id}`} className="group relative min-w-[150px] snap-start overflow-hidden rounded-2xl border border-white/8 bg-white/[.035] transition duration-500 hover:-translate-y-1 hover:border-violet-300/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-[180px]">
              <div className="relative aspect-[4/5]">
                {item.image ? <Image src={item.image} alt={item.name} fill sizes="180px" className="object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,.3),transparent_38%),linear-gradient(145deg,#171321,#09090d)]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 line-clamp-2 text-sm font-semibold text-white/90">{item.name}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
