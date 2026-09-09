"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";

export type RecentlyViewedCharacter = {
  id: number;
  name: string;
  image: string | null;
};

const RECENT_KEY = "anime-character-hub:recently-viewed";
const MAX_RECENT = 8;

function readRecent() {
  try {
    const stored = window.localStorage.getItem(RECENT_KEY);
    const parsed = stored ? (JSON.parse(stored) as RecentlyViewedCharacter[]) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
}

export function RecentlyViewed({ currentId }: { currentId?: number }) {
  const [items, setItems] = useState<RecentlyViewedCharacter[]>([]);

  useEffect(() => {
    const sync = () => setItems(readRecent().filter((item) => item.id !== currentId));
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [currentId]);

  if (!items.length) return null;

  return (
    <section className="border-t border-white/8 px-6 py-12 md:px-12" aria-labelledby="recent-heading">
      <div className="mx-auto max-w-[1500px]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[.25em] text-violet-300">Your trail</p>
            <h2 id="recent-heading" className="mt-2 flex items-center gap-2 text-2xl font-bold tracking-tight">
              Recently viewed <Clock3 size={18} className="text-white/35" />
            </h2>
          </div>
          <span className="text-[10px] uppercase tracking-[.18em] text-white/25">{items.length} saved locally</span>
        </div>

        <div className="mt-6 flex gap-3 overflow-x-auto pb-2 snap-x">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/characters/${item.id}`}
              className="group relative min-w-[150px] snap-start overflow-hidden rounded-2xl border border-white/8 bg-white/[.035] transition duration-500 hover:-translate-y-1 hover:border-violet-300/25 hover:bg-white/[.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:min-w-[180px]"
            >
              <div className="relative aspect-[4/5]">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="180px"
                    className="object-cover transition duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="h-full w-full bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,.3),transparent_38%),linear-gradient(145deg,#171321,#09090d)]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 line-clamp-2 text-sm font-semibold text-white/85">
                  {item.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ViewTracker({ character }: { character: RecentlyViewedCharacter }) {
  useEffect(() => {
    try {
      const current = readRecent().filter((item) => item.id !== character.id);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify([character, ...current].slice(0, MAX_RECENT)));
    } catch {
      // Recent history is an enhancement; the profile remains usable if storage is unavailable.
    }
  }, [character]);

  return null;
}
