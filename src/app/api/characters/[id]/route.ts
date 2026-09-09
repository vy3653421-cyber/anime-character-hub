import { NextResponse } from "next/server";

type JikanCharacterFull = {
  mal_id: number;
  name: string;
  about?: string | null;
  images?: {
    webp?: { image_url?: string | null };
    jpg?: { image_url?: string | null };
  };
  favorites?: number;
  url?: string | null;
  nicknames?: string[];
  anime?: Array<{
    mal_id: number;
    title: string;
    url?: string;
  }>;
  manga?: Array<{
    mal_id: number;
    title: string;
    url?: string;
  }>;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid character id." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://api.jikan.moe/v4/characters/${id}/full`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Character profile is temporarily unavailable." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const payload = (await response.json()) as { data?: JikanCharacterFull };
    const character = payload.data;

    if (!character) {
      return NextResponse.json({ error: "Character not found." }, { status: 404 });
    }

    return NextResponse.json(
      {
        id: character.mal_id,
        name: character.name,
        about: character.about ?? null,
        image:
          character.images?.webp?.image_url ?? character.images?.jpg?.image_url ?? null,
        favorites: character.favorites ?? 0,
        url: character.url ?? null,
        nicknames: character.nicknames ?? [],
        anime: character.anime ?? [],
        manga: character.manga ?? [],
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Character profile is temporarily unavailable." },
      { status: 502 },
    );
  }
}
