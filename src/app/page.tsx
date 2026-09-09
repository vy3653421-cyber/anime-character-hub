import { Search, Shuffle, Sparkles, Star } from "lucide-react";

const characters = [
  { name: "Gojo Satoru", series: "Jujutsu Kaisen", role: "Special Grade", accent: "#9b8cff", image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=900&q=85" },
  { name: "Levi Ackerman", series: "Attack on Titan", role: "Captain", accent: "#77b6ff", image: "https://images.unsplash.com/photo-1560972550-aba3456b5564?auto=format&fit=crop&w=900&q=85" },
  { name: "Tanjiro Kamado", series: "Demon Slayer", role: "Demon Slayer", accent: "#66d8c0", image: "https://images.unsplash.com/photo-1607604276583-eef5cbd8a4e9?auto=format&fit=crop&w=900&q=85" },
  { name: "Itachi Uchiha", series: "Naruto", role: "Akatsuki", accent: "#e879a9", image: "https://images.unsplash.com/photo-1606115915090-be18fea23ec7?auto=format&fit=crop&w=900&q=85" },
];

export default function Home() {
  const featured = characters[0];

  return (
    <main className="min-h-screen overflow-hidden bg-[#07070b] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(116,87,255,.18),transparent_32%),radial-gradient(circle_at_15%_80%,rgba(28,101,173,.10),transparent_28%)]" />
      <header className="relative z-20 flex h-20 items-center justify-between border-b border-white/8 px-6 md:px-12">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-black shadow-[0_0_30px_rgba(255,255,255,.18)]"><Sparkles size={17} /></div>
          <span className="text-sm font-semibold tracking-[.22em]">ANIME<span className="text-white/35">//</span>HUB</span>
        </div>
        <nav className="hidden items-center gap-8 text-xs font-medium text-white/55 md:flex">
          <a className="text-white" href="#discover">Discover</a><a href="#popular">Popular</a><a href="#series">Series</a><a href="#about">About</a>
        </nav>
        <button className="rounded-full border border-white/10 bg-white/5 p-2.5 text-white/70 transition hover:bg-white/10" aria-label="Search"><Search size={17} /></button>
      </header>

      <section className="relative mx-auto flex min-h-[650px] max-w-[1500px] items-center px-6 py-16 md:px-12 lg:min-h-[730px]">
        <div className="absolute right-[-8%] top-[4%] h-[620px] w-[620px] rounded-full border border-white/5 bg-gradient-to-br from-violet-400/10 to-transparent blur-[1px]" />
        <div className="relative z-10 max-w-2xl lg:pb-8">
          <div className="mb-5 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[.28em] text-violet-300"><span className="h-px w-8 bg-violet-300/70" /> Character Archive 01</div>
          <h1 className="text-[clamp(4rem,9vw,8.5rem)] font-black leading-[.78] tracking-[-.07em]">GOJO<br /><span className="text-white/25">SATORU</span></h1>
          <p className="mt-8 max-w-lg text-sm leading-7 text-white/50">The strongest modern sorcerer. Explore character profiles, abilities, affiliations and the stories that define the worlds of anime.</p>
          <div className="mt-8 flex flex-wrap gap-3"><button className="group flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs font-bold text-black transition hover:scale-[1.03]">Explore profile <span className="transition group-hover:translate-x-1">→</span></button><button className="flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-5 py-3 text-xs font-semibold text-white/75 hover:bg-white/10"><Shuffle size={14} /> Random character</button></div>
          <div className="mt-10 flex gap-8 text-[10px] uppercase tracking-[.18em] text-white/35"><span><b className="mr-2 text-white/80">∞</b>Characters</span><span><b className="mr-2 text-white/80">24</b>Series</span><span><b className="mr-2 text-white/80">06</b>Genres</span></div>
        </div>
        <div className="absolute bottom-8 right-8 hidden w-[45%] max-w-[620px] lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-2xl shadow-violet-950/30">
            <img src={featured.image} alt="Featured anime character artwork" className="h-full w-full object-cover opacity-75 grayscale-[20%]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07070b] via-transparent to-violet-500/10" />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.2em] text-white/45">Jujutsu Kaisen</p><p className="mt-1 text-xl font-bold">Satoru Gojo</p></div><div className="rounded-full border border-white/10 bg-black/30 p-2"><Star size={16} fill="currentColor" /></div></div>
          </div>
        </div>
      </section>

      <section id="discover" className="relative border-t border-white/8 px-6 py-16 md:px-12"><div className="mx-auto max-w-[1500px]"><div className="mb-8 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-[.25em] text-violet-300">The archive</p><h2 className="mt-2 text-3xl font-bold tracking-tight">Discover characters</h2></div><button className="text-xs text-white/45 hover:text-white">View all →</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{characters.map((character, index) => <article key={character.name} className="group relative overflow-hidden rounded-3xl border border-white/8 bg-white/[.035] transition duration-500 hover:-translate-y-1 hover:border-white/15"><div className="aspect-[4/5] overflow-hidden"><img src={character.image} alt={character.name} className="h-full w-full object-cover opacity-65 transition duration-700 group-hover:scale-105 group-hover:opacity-85" /><div className="absolute inset-0 bg-gradient-to-t from-[#09090d] via-transparent to-transparent" /></div><div className="absolute bottom-0 left-0 right-0 p-5"><div className="mb-2 text-[9px] uppercase tracking-[.2em]" style={{color:character.accent}}>{character.series}</div><h3 className="text-lg font-bold">{character.name}</h3><p className="mt-1 text-xs text-white/40">{character.role}</p></div><div className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[9px] text-white/50">0{index+1}</div></article>)}</div></div></section>

      <footer id="about" className="border-t border-white/8 px-6 py-10 text-center text-[10px] uppercase tracking-[.2em] text-white/25">Anime Character Hub · A cinematic character archive</footer>
    </main>
  );
}
