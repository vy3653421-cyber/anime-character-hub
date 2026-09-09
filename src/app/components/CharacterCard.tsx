import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Star } from "lucide-react";

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
    <article className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[.035] shadow-[0_20px_70px_rgba(0,0,0,.12)] transition-[transform,border-color,box-shadow] duration-500 hover:-translate-y-1 hover:border-white/18 hover:shadow-[0_28px_90px_rgba(0,0,0,.28)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link
        href={`/characters/${character.id}`}
        aria-label={`View ${character.name} profile`}
        className="absolute inset-0 z-10 rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 focus-visible:ring-inset"
      />

      <div className="relative aspect-[4/5] overflow-hidden">
        {character.image ? (
          <Image
            src={character.image}
            alt={character.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={rank <= 4}
            className="object-cover opacity-70 transition-[transform,opacity,filter] duration-700 ease-out group-hover:scale-[1.055] group-hover:opacity-95 group-hover:saturate-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_25%,rgba(167,139,250,.32),transparent_35%),linear-gradient(145deg,#191421,#09090d)] transition-transform duration-700 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-[#09090d]/15 to-transparent transition-opacity duration-500 group-hover:from-[#07070b] motion-reduce:transition-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_15%,rgba(167,139,250,.18),transparent_32%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100 motion-reduce:transition-none" />
      </div>

      <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2">
        <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[.18em] text-white/55 backdrop-blur-md transition duration-500 group-hover:border-violet-300/25 group-hover:text-violet-200 motion-reduce:transition-none">
          {String(rank).padStart(2, "0")}
        </span>
      </div>

      <button
        type="button"
        onClick={() => onToggleSaved(character.id)}
        className="absolute right-4 top-4 z-20 rounded-full border border-white/10 bg-black/35 p-2.5 text-white/65 backdrop-blur-md transition-[transform,background-color,color,border-color] duration-300 hover:scale-110 hover:border-white/20 hover:bg-black/60 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80 motion-reduce:transition-none motion-reduce:hover:scale-100"
        aria-label={`${saved ? "Remove" : "Save"} ${character.name}`}
      >
        <Star size={14} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
      </button>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-[9px] uppercase tracking-[.2em] text-violet-300 transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">Character archive</span>
          <ArrowUpRight size={14} className="translate-y-1 opacity-0 transition-[transform,opacity] duration-500 group-hover:translate-x-0.5 group-hover:translate-y-0 group-hover:opacity-70 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-bold tracking-tight transition-transform duration-500 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">{character.name}</h3>
        <p className="mt-1 text-xs text-white/40 transition-colors duration-500 group-hover:text-white/55 motion-reduce:transition-none">
          {character.favorites.toLocaleString()} community favorites
        </p>
      </div>
    </article>
  );
}
