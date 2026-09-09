import { NextResponse } from "next/server";

type JikanVoice = {
  person?: { mal_id?: number; name?: string; url?: string };
  language?: string;
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
    const response = await fetch(`https://api.jikan.moe/v4/characters/${id}/voices`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Voice cast is temporarily unavailable." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const payload = (await response.json()) as { data?: JikanVoice[] };
    const voices = (payload.data ?? [])
      .map((voice) => ({
        id: voice.person?.mal_id ?? null,
        name: voice.person?.name ?? null,
        language: voice.language ?? "Unknown",
        url: voice.person?.url ?? null,
      }))
      .filter((voice): voice is { id: number | null; name: string; language: string; url: string | null } => Boolean(voice.name));

    return NextResponse.json(
      { voices },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Voice cast is temporarily unavailable." },
      { status: 502 },
    );
  }
}
