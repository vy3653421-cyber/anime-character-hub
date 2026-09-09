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

const PAGE_SIZE = 24;
const MAX_PAGE = 5;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawPage = Number(searchParams.get("page") ?? "1");
  const page = Number.isInteger(rawPage) && rawPage >= 1 ? Math.min(rawPage, MAX_PAGE) : 1;

  try {
    const response = await fetch(
      `https://api.jikan.moe/v4/top/characters?limit=${PAGE_SIZE}&page=${page}`,
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Character catalog is temporarily unavailable." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      data?: JikanCharacter[];
      pagination?: { has_next_page?: boolean };
    };
    const characters = (payload.data ?? []).map((character) => ({
      id: character.mal_id,
      name: character.name,
      image: character.images?.webp?.image_url ?? character.images?.jpg?.image_url ?? null,
      favorites: character.favorites ?? 0,
      url: character.url ?? null,
    }));

    return NextResponse.json(
      {
        characters,
        page,
        hasNextPage: Boolean(payload.pagination?.has_next_page) && page < MAX_PAGE,
      },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Character catalog is temporarily unavailable." },
      { status: 502 },
    );
  }
}
