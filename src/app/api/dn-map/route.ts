import { NextRequest, NextResponse } from "next/server";

/**
 * Mapbox Static Images proxy for the Day n Night venue map tile.
 *
 * Constructs the Mapbox Static Images API URL server-side using
 * `MAPBOX_API_KEY` (no NEXT_PUBLIC_ prefix) so the token never
 * reaches the browser. The client renders a plain <img> pointing at
 * this route — no SDK, no client-side token.
 *
 * Params (all optional, have safe defaults):
 *   lat   — latitude  (default: 37.5435, Haebangchon placeholder)
 *   lng   — longitude (default: 126.9736)
 *   zoom  — map zoom 1–22 (default: 15)
 *   w     — tile width in CSS px, max 1280 (default: 640)
 *   h     — tile height in CSS px, max 1280 (default: 280)
 *
 * The response is always a 2× retina PNG (Mapbox @2x suffix).
 * Auth: not required — the tile is for a public venue.
 * Cache: 1 hour CDN / 24 h stale-while-revalidate.
 */

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function safeFloat(raw: string | null, fallback: number): number {
  const n = parseFloat(raw ?? "");
  return isNaN(n) ? fallback : n;
}

function safeInt(raw: string | null, fallback: number): number {
  const n = parseInt(raw ?? "", 10);
  return isNaN(n) ? fallback : n;
}

export async function GET(request: NextRequest) {
  const token = process.env.MAPBOX_API_KEY;
  if (!token) {
    return new NextResponse(null, { status: 503 });
  }

  const sp = request.nextUrl.searchParams;
  const lat = clamp(safeFloat(sp.get("lat"), 37.543933), -90, 90);
  const lng = clamp(safeFloat(sp.get("lng"), 126.984232), -180, 180);
  const zoom = clamp(safeInt(sp.get("zoom"), 15), 1, 22);
  const w = clamp(safeInt(sp.get("w"), 640), 1, 1280);
  const h = clamp(safeInt(sp.get("h"), 280), 1, 1280);

  const mapboxUrl =
    `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/` +
    `${lng},${lat},${zoom}/${w}x${h}@2x?access_token=${token}`;

  let upstream: Response;
  try {
    upstream = await fetch(mapboxUrl, { next: { revalidate: 3600 } });
  } catch {
    return new NextResponse(null, { status: 502 });
  }

  if (!upstream.ok) {
    return new NextResponse(null, { status: upstream.status });
  }

  const image = await upstream.arrayBuffer();
  return new NextResponse(image, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400"
    }
  });
}
