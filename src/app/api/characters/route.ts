import { NextResponse } from "next/server";

type JikanCharacter = {
  mal_id: number;
  name: string;
  images?: {
    webp?: { image_url?: string | null };
    jpg?: { image_url?: string | null };
  };
  favorites?: number;
  url?: string;
};

const JIKAN_URL = "https://api.jikan.moe/v4/top/characters?limit=24";

export async function GET() {
  try {
    const response = await fetch(JIKAN_URL, { next: { revalidate: 3600 } });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Character catalog is temporarily unavailable." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as { data?: JikanCharacter[] };
    const characters = (payload.data ?? []).map((character) => ({
      id: character.mal_id,
      name: character.name,
      image: character.images?.webp?.image_url ?? character.images?.jpg?.image_url ?? null,
      favorites: character.favorites ?? 0,
      url: character.url ?? null,
    }));

    return NextResponse.json(
      { characters },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Character catalog is temporarily unavailable." },
      { status: 502 },
    );
  }
}
