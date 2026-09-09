import { NextResponse } from "next/server";

type JikanPicture = {
  jpg?: { image_url?: string | null; large_image_url?: string | null };
  webp?: { image_url?: string | null; large_image_url?: string | null };
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
    const response = await fetch(`https://api.jikan.moe/v4/characters/${id}/pictures`, {
      next: { revalidate: 86400 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Character gallery is temporarily unavailable." },
        { status: response.status === 404 ? 404 : 502 },
      );
    }

    const payload = (await response.json()) as { data?: JikanPicture[] };
    const pictures = (payload.data ?? [])
      .map((picture) => ({
        image:
          picture.webp?.large_image_url ??
          picture.jpg?.large_image_url ??
          picture.webp?.image_url ??
          picture.jpg?.image_url ??
          null,
      }))
      .filter((picture): picture is { image: string } => Boolean(picture.image));

    return NextResponse.json(
      { pictures },
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Character gallery is temporarily unavailable." },
      { status: 502 },
    );
  }
}
