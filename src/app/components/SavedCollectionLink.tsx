"use client";

import Link from "next/link";
import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const KEY = "anime-character-hub:favorites";

function countSaved() {
  try {
    const value = JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((id) => typeof id === "number").length : 0;
  } catch {
    return 0;
  }
}

export function SavedCollectionLink() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(countSaved());
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  if (pathname === "/saved") return null;

  return (
    <Link href="/saved" className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0b0a10]/85 px-4 py-3 text-xs font-semibold text-white/70 shadow-2xl shadow-black/40 backdrop-blur-xl transition duration-300 hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-[#11101a] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Bookmark size={14} fill={count ? "currentColor" : "none"} aria-hidden="true" />
      <span>Saved</span>
      {count > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold text-black">{count}</span>}
    </Link>
  );
}
