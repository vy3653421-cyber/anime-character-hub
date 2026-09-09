"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Heart, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

type CharacterProfile = {
  id: number;
  name: string;
  about: string | null;
  image: string | null;
  favorites: number;
  url: string | null;
  nicknames: string[];
  anime: Array<{ mal_id: number; title: string; url?: string }>;
  manga: Array<{ mal_id: number; title: string; url?: string }>;
};

const FAVORITES_KEY = "anime-character-hub:favorites";

export default function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const [character, setCharacter] = useState<CharacterProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const { id } = await params;
        const response = await fetch(`/api/characters/${id}`);
        if (!response.ok) throw new Error("Profile request failed");
        const profile = (await response.json()) as CharacterProfile;
        setCharacter(profile);

        try {
          const stored = window.localStorage.getItem(FAVORITES_KEY);
          const ids = stored ? (JSON.parse(stored) as number[]) : [];
          window.setTimeout(() => setSaved(ids.includes(profile.id)), 0);
        } catch {
          // Ignore unavailable or malformed local storage.
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params]);

  const toggleSaved = () => {
    if (!character) return;
    setSaved((current) => {
      try {
        const stored = window.localStorage.getItem(FAVORITES_KEY);
        const ids = stored ? (JSON.parse(stored) as number[]) : [];
        const next = current
          ? ids.filter((id) => id !== character.id)
          : [...new Set([...ids, character.id])];
        window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      } catch {
        // Keep the current UI state if browser storage is unavailable.
      }
      return !current;
    });
  };

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07070b] px-6 text-white">
        <div className="w-full max-w-md">
          <div className="aspect-[4/5] animate-pulse rounded-[2rem] border border-white/8 bg-white/[.035]" />
          <div className="mt-6 h-4 w-32 animate-pulse rounded bg-white/10" />
          <div className="mt-4 h-16 w-4/5 animate-pulse rounded bg-white/10" />
        </div>
      </main>
    );
  }

  if (error || !character) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07070b] px-6 text-center text-white">
        <div>
          <p className="text-xs uppercase tracking-[.22em] text-violet-300">Profile unavailable</p>
          <h1 className="mt-3 text-3xl font-bold">Character not found</h1>
          <Link href="/" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 text-xs font-bold text-black transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
            Return to archive
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(116,87,255,.2),transparent_34%),radial-gradient(circle_at_10%_85%,rgba(28,101,173,.12),transparent_30%)]" />

      <header className="relative z-10 flex h-20 items-center justify-between border-b border-white/8 px-6 md:px-12">
        <Link href="/" className="flex items-center gap-3 text-white/65 transition hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
          <ArrowLeft size={17} />
          <span className="text-xs font-semibold uppercase tracking-[.2em]">Back to archive</span>
        </Link>
        <div className="hidden items-center gap-2 text-xs font-semibold tracking-[.2em] md:flex">
          <Sparkles size={14} /> ANIME<span className="text-white/30">/</span>HUB
        </div>
        <button
          onClick={toggleSaved}
          className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/75 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
          aria-label={saved ? "Remove character from saved" : "Save character"}
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} />
        </button>
      </header>

      <section className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1500px] items-center gap-10 px-6 py-12 md:px-12 lg:grid-cols-[minmax(320px,520px)_1fr] lg:gap-20 lg:py-16">
        <div className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.035] shadow-2xl shadow-violet-950/30 transition duration-700 hover:border-white/15">
          <div className="relative aspect-[4/5]">
            {character.image ? (
              <Image
                src={character.image}
                alt={character.name}
                fill
                priority
                sizes="(max-width: 1024px) min(100vw - 3rem, 520px), 520px"
                className="object-cover transition duration-1000 hover:scale-[1.02]"
              />
            ) : (
              <div className="h-full w-full bg-[radial-gradient(circle_at_50%_25%,rgba(167,139,250,.35),transparent_35%),linear-gradient(145deg,#191421,#09090d)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-transparent" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-[10px] uppercase tracking-[.25em] text-violet-300">Character archive</p>
            <p className="mt-2 text-sm text-white/50">{character.favorites.toLocaleString()} community favorites</p>
          </div>
        </div>

        <div className="relative max-w-3xl">
          <p className="text-[10px] uppercase tracking-[.28em] text-violet-300">Profile / {character.id}</p>
          <h1 className="mt-4 text-[clamp(3.4rem,8vw,7.5rem)] font-black leading-[.84] tracking-[-.065em]">
            {character.name}
          </h1>

          {character.nicknames.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-2">
              {character.nicknames.slice(0, 5).map((nickname) => (
                <span key={nickname} className="rounded-full border border-white/10 bg-white/[.045] px-3 py-1.5 text-[10px] text-white/55">
                  {nickname}
                </span>
              ))}
            </div>
          )}

          <p className="mt-8 max-w-2xl whitespace-pre-line text-sm leading-7 text-white/55">
            {character.about || "No biography is available for this character yet."}
          </p>

          <div className="mt-10 grid max-w-xl gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-white/[.035] p-5">
              <p className="text-[9px] uppercase tracking-[.2em] text-white/30">Anime appearances</p>
              <p className="mt-2 text-2xl font-bold">{character.anime.length}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[.035] p-5">
              <p className="text-[9px] uppercase tracking-[.2em] text-white/30">Manga appearances</p>
              <p className="mt-2 text-2xl font-bold">{character.manga.length}</p>
            </div>
          </div>

          {(character.anime.length > 0 || character.manga.length > 0) && (
            <section className="mt-12 border-t border-white/8 pt-8" aria-labelledby="appearances-heading">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[.25em] text-violet-300">Connected worlds</p>
                  <h2 id="appearances-heading" className="mt-2 text-2xl font-bold tracking-tight">Appearances</h2>
                </div>
                <span className="text-[10px] uppercase tracking-[.18em] text-white/25">Top entries</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {character.anime.slice(0, 6).map((entry) => (
                  entry.url ? (
                    <a
                      key={`anime-${entry.mal_id}`}
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-2xl border border-white/8 bg-white/[.035] p-4 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
                    >
                      <p className="text-[9px] uppercase tracking-[.2em] text-violet-300/70">Anime</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/80 group-hover:text-white">{entry.title}</p>
                    </a>
                  ) : (
                    <div key={`anime-${entry.mal_id}`} className="rounded-2xl border border-white/8 bg-white/[.035] p-4">
                      <p className="text-[9px] uppercase tracking-[.2em] text-violet-300/70">Anime</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/60">{entry.title}</p>
                    </div>
                  )
                ))}
                {character.manga.slice(0, 6).map((entry) => (
                  entry.url ? (
                    <a
                      key={`manga-${entry.mal_id}`}
                      href={entry.url}
                      target="_blank"
                      rel="noreferrer"
                      className="group rounded-2xl border border-white/8 bg-white/[.035] p-4 transition hover:-translate-y-0.5 hover:border-violet-300/25 hover:bg-white/[.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70"
                    >
                      <p className="text-[9px] uppercase tracking-[.2em] text-sky-300/70">Manga</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/80 group-hover:text-white">{entry.title}</p>
                    </a>
                  ) : (
                    <div key={`manga-${entry.mal_id}`} className="rounded-2xl border border-white/8 bg-white/[.035] p-4">
                      <p className="text-[9px] uppercase tracking-[.2em] text-sky-300/70">Manga</p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-white/60">{entry.title}</p>
                    </div>
                  )
                ))}
              </div>
            </section>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {character.url && (
              <a href={character.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-black transition hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
                Open source profile <ExternalLink size={13} />
              </a>
            )}
            <Link href="/" className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold text-white/70 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70">
              Explore more characters
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
