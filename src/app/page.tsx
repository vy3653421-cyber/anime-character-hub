"use client";

import Link from "next/link";
import { Search, Shuffle, Sparkles, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ArchiveControls } from "./components/ArchiveControls";
import { CharacterCard } from "./components/CharacterCard";
import { Reveal } from "./components/Reveal";

type Character = {
  id: number;
  name: string;
  image: string | null;
  favorites: number;
  url: string | null;
};

const fallbackCharacters: Character[] = [
  { id: 1, name: "Spike Spiegel", image: null, favorites: 0, url: null },
  { id: 2, name: "Monkey D. Luffy", image: null, favorites: 0, url: null },
  { id: 3, name: "Levi Ackerman", image: null, favorites: 0, url: null },
  { id: 4, name: "Satoru Gojo", image: null, favorites: 0, url: null },
];

const FAVORITES_KEY = "anime-character-hub:favorites";

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>(fallbackCharacters);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "saved">("all");
  const [sort, setSort] = useState<"popular" | "name">("popular");
  const [favorites, setFavorites] = useState<number[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY);
      if (stored) setFavorites(JSON.parse(stored) as number[]);
    } catch {
      // Ignore unavailable or malformed local storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch {
      // Favorites remain available for the current session.
    }
  }, [favorites]);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const response = await fetch("/api/characters");
        if (!response.ok) throw new Error("Catalog request failed");
        const data = (await response.json()) as { characters?: Character[] };
        if (data.characters?.length) setCharacters(data.characters);
      } catch {
        setCatalogError(true);
      } finally {
        setCatalogLoading(false);
      }
    };

    void loadCharacters();
  }, []);

  const filteredCharacters = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return characters
      .filter((character) => {
        const matchesQuery = !normalized || character.name.toLowerCase().includes(normalized);
        const matchesFilter = filter === "all" || favorites.includes(character.id);
        return matchesQuery && matchesFilter;
      })
      .sort((a, b) => (sort === "popular" ? b.favorites - a.favorites : a.name.localeCompare(b.name)));
  }, [characters, favorites, filter, query, sort]);

  const featured = characters[0];

  const toggleFavorite = (id: number) => {
    setFavorites((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const randomCharacter = () => {
    if (!characters.length) return;
    const next = characters[Math.floor(Math.random() * characters.length)];
    setQuery(next.name);
    setFilter("all");
    document.getElementById("discover")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(116,87,255,.18),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(28,101,173,.10),transparent_28%)]" />

      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/8 px-6 md:px-12">
        <a href="#top" className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,.18)]"><Sparkles size={17} /></div>
          <span className="text-sm font-semibold tracking-[.22em]">ANIME<span className="text-white/35">//</span>HUB</span>
        </a>
        <nav className="hidden items-center gap-8 text-xs font-medium text-white/55 md:flex">
          <a className="text-white" href="#discover">Discover</a>
          <a href="#popular">Popular</a>
          <a href="#about">About</a>
        </nav>
        <button onClick={() => document.getElementById("search")?.focus()} className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10" aria-label="Focus search"><Search size={17} /></button>
      </header>

      <section id="top" className="relative mx-auto flex min-h-[650px] max-w-[1500px] items-center px-6 py-16 md:px-12 lg:min-h-[730px]">
        <div className="absolute right-[-8%] top-[4%] h-[620px] w-[620px] rounded-full border border-white/5 bg-gradient-to-br from-violet-400/10 to-transparent" />
        <div className="relative z-10 max-w-2xl lg:pb-8">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.28em] text-violet-300"><span className="h-px w-8 bg-violet-300/70" /> Character Archive</div>
          <h1 className="text-[clamp(4rem,9vw,8.5rem)] font-black leading-[.78] tracking-[-.07em]">{featured?.name?.split(" ")[0]?.toUpperCase()}<br /><span className="text-white/25">{featured?.name?.split(" ").slice(1).join(" ").toUpperCase()}</span></h1>
          <p className="mt-8 max-w-lg text-sm leading-7 text-white/50">A cinematic character archive built for discovery. Search the catalog, save favorites, jump to a random character and explore the people that define anime worlds.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#discover" className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-black transition hover:scale-[1.03]">Explore archive <span className="transition group-hover:translate-x-1">→</span></a>
            <button onClick={randomCharacter} className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-xs font-semibold text-white/75 hover:bg-white/10"><Shuffle size={14} /> Random character</button>
          </div>
          <div className="mt-10 flex gap-8 text-[10px] uppercase tracking-[.18em] text-white/35"><span><b className="mr-2 text-white/80">{characters.length || "∞"}</b>Loaded</span><span><b className="mr-2 text-white/80">{favorites.length}</b>Saved</span><span><b className="mr-2 text-white/80">24</b>Per feed</span></div>
        </div>
        <div className="absolute bottom-8 right-8 hidden w-[45%] max-w-[620px] lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-violet-950/30">
            {featured?.image ? <img src={featured.image} alt={featured.name} className="h-full w-full object-cover opacity-80" /> : <div className="h-full w-full bg-[radial-gradient(circle_at_50%_30%,rgba(167,139,250,.4),transparent_35%),linear-gradient(145deg,#171321,#09090d)]" />}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-violet-500/10" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-white/45">Top character</p><p className="mt-1 text-xl font-bold">{featured?.name}</p></div><button onClick={() => featured && toggleFavorite(featured.id)} className="rounded-full border border-white/10 bg-black/30 p-2"><Star size={16} fill={featured && favorites.includes(featured.id) ? "currentColor" : "none"} aria-hidden="true" /></button></div>
          </div>
        </div>
      </section>

      <section id="discover" className="relative border-t border-white/8 px-6 py-16 md:px-12">
        <div className="mx-auto max-w-[1500px]">
          <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-[10px] uppercase tracking-[.25em] text-violet-300">The archive</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Discover characters</h2></div>
            <ArchiveControls query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} sort={sort} onSortChange={setSort} savedCount={favorites.length} />
          </div>

          {catalogError && <div className="mb-6 rounded-2xl border border-amber-200/10 bg-amber-200/[.04] px-4 py-3 text-xs text-white/50">Live catalog is unavailable right now, so the archive is showing its fallback entries.</div>}
          {catalogLoading && <div className="mb-6 text-xs uppercase tracking-[.2em] text-white/30">Loading character archive…</div>}

          <div id="popular" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredCharacters.map((character, index) => (
              <Reveal key={character.id}>
                <CharacterCard character={character} rank={index + 1} saved={favorites.includes(character.id)} onToggleSaved={toggleFavorite} />
              </Reveal>
            ))}
          </div>

          {!catalogLoading && filteredCharacters.length === 0 && <div className="rounded-3xl border border-dashed border-white/10 py-20 text-center"><p className="text-sm font-semibold">{filter === "saved" ? "No saved characters" : "No character found"}</p><p className="mt-2 text-xs text-white/35">{filter === "saved" ? "Save characters with the star button to build your collection." : "Try another name or clear the search."}</p></div>}
        </div>
      </section>

      <footer id="about" className="border-t border-white/8 px-6 py-10 text-center text-[10px] uppercase tracking-[.2em] text-white/25">Anime Character Hub · Cinematic character archive</footer>
    </main>
  );
}
