"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Search, Star, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const FAVORITES_KEY = "anime-character-hub:favorites";

type Character = {
  id: number;
  name: string;
  image: string | null;
  favorites: number;
  url: string | null;
};

function readIds() {
  try {
    const value = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((id): id is number => typeof id === "number") : [];
  } catch {
    return [];
  }
}

export default function SavedPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const ids = readIds().slice(0, 12);
    if (!ids.length) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const results = await Promise.all(ids.map(async (id) => {
          const response = await fetch(`/api/characters/${id}`);
          if (!response.ok) return null;
          return (await response.json()) as Character;
        }));
        if (!cancelled) setCharacters(results.filter((item): item is Character => Boolean(item)));
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, []);

  const visible = useMemo(() => characters.filter((character) => character.name.toLowerCase().includes(query.trim().toLowerCase())), [characters, query]);

  const remove = (id: number) => {
    const nextIds = readIds().filter((item) => item !== id);
    try { window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(nextIds)); } catch { /* Session state still updates. */ }
    setCharacters((current) => current.filter((item) => item.id !== id));
  };

  const hasSaved = characters.length > 0 || readIds().length > 0;

  return (
    <main className="min-h-screen bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(116,87,255,.16),transparent_30%),radial-gradient(circle_at_10%_85%,rgba(28,101,173,.10),transparent_28%)]" />
      <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/8 px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3 text-sm font-semibold tracking-[.2em] text-white/80 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
          <ArrowLeft size={16} /> ANIME/HUB
        </Link>
        <span className="text-[10px] uppercase tracking-[.2em] text-white/30">Private collection</span>
      </header>

      <section className="relative mx-auto max-w-[1500px] px-6 py-16 md:px-12 md:py-24">
        <div className="max-w-3xl">
          <p className="text-[10px] uppercase tracking-[.28em] text-violet-300">Your archive</p>
          <h1 className="mt-3 text-[clamp(3rem,7vw,6rem)] font-black leading-[.9] tracking-[-.06em]">Saved<br /><span className="text-white/25">characters.</span></h1>
          <p className="mt-7 max-w-xl text-sm leading-7 text-white/45">A focused space for the characters you want to revisit. Your saved list is stored locally in this browser.</p>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-y border-white/8 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30" aria-hidden="true" />
            <label htmlFor="saved-search" className="sr-only">Search saved characters</label>
            <input id="saved-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search saved…" className="w-full rounded-2xl border border-white/8 bg-white/[.04] py-3 pl-11 pr-4 text-sm outline-none transition focus:border-violet-300/35 focus:bg-white/[.06]" />
          </div>
          <span className="text-[10px] uppercase tracking-[.2em] text-white/25">{characters.length} saved</span>
        </div>

        {loading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="aspect-[4/5] motion-safe:animate-pulse rounded-3xl border border-white/8 bg-white/[.035]" />)}</div>}
        {error && <div className="rounded-2xl border border-amber-200/10 bg-amber-200/[.04] p-5 text-sm text-white/50">Some saved profiles could not be loaded. You can return to the archive and try again.</div>}
        {!loading && !error && !hasSaved && <div className="rounded-[2rem] border border-dashed border-white/10 bg-white/[.025] px-6 py-16 text-center"><Star size={22} className="mx-auto text-violet-300/60" /><h2 className="mt-4 text-xl font-bold">Nothing saved yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/40">Save characters from the archive and they will appear here instantly.</p><Link href="/#discover" className="mt-6 inline-flex rounded-full bg-white px-5 py-3 text-xs font-bold text-black transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">Explore archive</Link></div>}
        {!loading && !error && hasSaved && !visible.length && <div className="rounded-2xl border border-white/8 bg-white/[.025] p-10 text-center text-sm text-white/40">No saved character matches “{query}”.</div>}

        {!loading && visible.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{visible.map((character) => (
          <article key={character.id} className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[.035] transition duration-500 hover:-translate-y-1 hover:border-white/16 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
            <Link href={`/characters/${character.id}`} className="absolute inset-0 z-10" aria-label={`View ${character.name} profile`} />
            <div className="relative aspect-[4/5] overflow-hidden">
              {character.image ? <Image src={character.image} alt={character.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover opacity-75 transition duration-700 group-hover:scale-[1.045] group-hover:opacity-95 motion-reduce:transition-none motion-reduce:group-hover:scale-100" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_50%_25%,rgba(167,139,250,.3),transparent_35%),linear-gradient(145deg,#191421,#09090d)]" />}
              <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-transparent" />
              <button type="button" onClick={() => remove(character.id)} className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/40 p-2.5 text-white/60 backdrop-blur-md transition hover:bg-red-300/10 hover:text-red-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80" aria-label={`Remove ${character.name} from saved`}><Trash2 size={14} /></button>
              <div className="absolute bottom-0 left-0 right-0 z-10 p-5 pointer-events-none"><p className="text-[9px] uppercase tracking-[.2em] text-violet-300">Saved character</p><h2 className="mt-2 text-lg font-bold">{character.name}</h2><p className="mt-1 text-xs text-white/40">{character.favorites.toLocaleString()} community favorites</p></div>
            </div>
            {character.url && <a href={character.url} target="_blank" rel="noreferrer" className="relative z-20 flex items-center justify-between border-t border-white/8 px-5 py-3 text-[10px] uppercase tracking-[.15em] text-white/30 transition hover:text-white/70">MAL profile <ExternalLink size={12} /></a>}
          </article>
        ))}</div>}

        <div className="mt-12 flex justify-center"><Link href="/#discover" className="inline-flex items-center rounded-full border border-white/10 bg-white/[.04] px-5 py-3 text-xs font-semibold text-white/60 transition hover:bg-white/[.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">Back to discovery</Link></div>
      </section>
    </main>
  );
}
