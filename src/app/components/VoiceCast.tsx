"use client";

import Link from "next/link";
import { ChevronRight, Mic2, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Voice = { id: number | null; name: string; language: string; url: string | null };

export function VoiceCast() {
  const pathname = usePathname();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const match = pathname.match(/^\/characters\/(\d+)$/);
  const characterId = match?.[1] ?? null;

  useEffect(() => {
    setOpen(false);
    setVoices([]);
    setLoadedFor(null);
  }, [characterId]);

  const loadVoices = async () => {
    if (!characterId || loadedFor === characterId) {
      setOpen(true);
      return;
    }
    setOpen(true);
    setLoading(true);
    try {
      const response = await fetch(`/api/characters/${characterId}/voices`);
      if (!response.ok) throw new Error("Voice request failed");
      const data = (await response.json()) as { voices?: Voice[] };
      setVoices(data.voices ?? []);
      setLoadedFor(characterId);
    } catch {
      setVoices([]);
    } finally {
      setLoading(false);
    }
  };

  if (!characterId) return null;

  return (
    <>
      <button
        type="button"
        onClick={loadVoices}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#111017]/90 px-4 py-3 text-xs font-semibold text-white/85 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-[#17131f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        aria-expanded={open}
        aria-controls="voice-cast-panel"
      >
        <Mic2 size={15} className="text-violet-300" />
        Voice cast
        <ChevronRight size={14} className={`text-white/35 transition-transform duration-300 ${open ? "rotate-90" : ""} motion-reduce:transition-none`} />
      </button>

      {open && (
        <div id="voice-cast-panel" className="fixed inset-x-4 bottom-20 z-40 max-h-[70vh] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0b0a10]/95 text-white shadow-2xl shadow-black/60 backdrop-blur-2xl sm:left-auto sm:right-6 sm:w-[390px]">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <p className="text-[9px] uppercase tracking-[.25em] text-violet-300">Character intelligence</p>
              <h2 className="mt-1 text-lg font-bold">Voice cast</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-white/45 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none" aria-label="Close voice cast">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-[calc(70vh-76px)] overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-2 p-2" aria-label="Loading voice cast">
                {[0, 1, 2].map((item) => <div key={item} className="motion-safe:animate-pulse h-16 rounded-2xl bg-white/[.045]" />)}
              </div>
            ) : voices.length > 0 ? (
              <div className="space-y-2">
                {voices.map((voice, index) => (
                  <div key={`${voice.id ?? voice.name}-${voice.language}-${index}`} className="rounded-2xl border border-white/8 bg-white/[.035] p-4 transition hover:border-violet-300/20 hover:bg-white/[.05] motion-reduce:transition-none">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[9px] uppercase tracking-[.2em] text-violet-300/75">{voice.language}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-white/85">{voice.name}</p>
                      </div>
                      {voice.url && <Link href={voice.url} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-white/10 px-2.5 py-1.5 text-[9px] font-semibold text-white/45 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none">MAL</Link>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center">
                <Mic2 size={20} className="mx-auto text-white/20" />
                <p className="mt-3 text-xs text-white/40">No voice cast data is available.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
