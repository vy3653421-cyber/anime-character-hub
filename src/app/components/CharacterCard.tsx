import Link from "next/link";
import { Star } from "lucide-react";

type Character = {
  id: number;
  name: string;
  image: string | null;
  favorites: number;
};

type Props = {
  character: Character;
  rank: number;
  saved: boolean;
  onToggleSaved: (id: number) => void;
};

export function CharacterCard({ character, rank, saved, onToggleSaved }: Props) {
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[.035] transition duration-500 hover:-translate-y-1 hover:border-white/15">
      <Link
        href={`/characters/${character.id}`}
        aria-label={`View ${character.name} profile`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 focus-visible:ring-inset"
      />
      <div className="aspect-[4/5] overflow-hidden">
        {character.image ? (
          <img
            src={character.image}
            alt={character.name}
            loading={rank > 4 ? "lazy" : "eager"}
            className="h-full w-full object-cover opacity-70 transition duration-700 group-hover:scale-105 group-hover:opacity-95"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_25%,rgba(167,139,250,.32),transparent_35%),linear-gradient(145deg,#191421,#09090d)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-transparent" />
      </div>
      <button
        type="button"
        onClick={() => onToggleSaved(character.id)}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/35 p-2 text-white/70 backdrop-blur-md transition hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80"
        aria-label={`${saved ? "Remove" : "Save"} ${character.name}`}
      >
        <Star size={14} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      </button>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-5">
        <div className="mb-2 text-[9px] uppercase tracking-[.2em] text-violet-300">Rank {rank}</div>
        <h3 className="text-lg font-bold">{character.name}</h3>
        <p className="mt-1 text-xs text-white/40">{character.favorites.toLocaleString()} community favorites</p>
      </div>
    </article>
  );
}
