import { NextRequest, NextResponse } from "next/server";

import { currentUser } from "@/lib/auth/context/get-context-props";

/**
 * Mapbox-backed city autocomplete for the settings location field.
 *
 * Filtered to **city-grade** results only (`types=place,locality`) so a
 * user typing a specific address gets the parent city back, not the
 * exact street. Handles are stored on the user as `${city}, ${country}`.
 *
 * Auth: session-required. Anonymous calls 401. Discourages key-scraping.
 *
 * Rate limit: light per-session (in-process, best-effort) — 30 reqs / 60s
 * per session id. The component already debounces 250ms client-side, so
 * a real user won't hit this.
 *
 * Token: server-side only. `MAPBOX_API_KEY` (no `NEXT_PUBLIC_` prefix).
 */

interface MapboxFeature {
  id: string;
  text: string;
  place_name: string;
  context?: { id: string; text: string }[];
}

interface MapboxResponse {
  features: MapboxFeature[];
}

interface PlaceResult {
  /** Visible label (e.g., "Seoul, South Korea"). */
  label: string;
  /** Stored value — same as label for v1. */
  value: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

// In-process rate limit map. Best-effort; resets on dev reload. For
// production we'd back this with Redis or the existing rate limit
// infrastructure if there is one.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimitOk(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

function extractCountry(feature: MapboxFeature): string | null {
  const country = feature.context?.find((c) => c.id.startsWith("country."));
  return country?.text ?? null;
}

export async function GET(request: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = process.env.MAPBOX_API_KEY;
  if (!token) {
    return NextResponse.json(
      { error: "Place search is not configured." },
      { status: 503 }
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (!rateLimitOk(user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429 }
    );
  }

  // Mapbox Geocoding v5 endpoint. `place` covers cities and large
  // settlements; `locality` covers smaller towns. Together they give
  // city-grade granularity and never return a street address.
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("types", "place,locality");
  url.searchParams.set("limit", "6");
  url.searchParams.set("autocomplete", "true");

  let response: Response;
  try {
    response = await fetch(url, {
      // Mapbox Geocoding tolerates Cache-Control:no-store, but we still
      // give it a brief Next-side cache so repeated keystrokes within
      // the debounce window are deduped.
      next: { revalidate: 30 }
    });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error ? e.message : "Couldn't reach the place search."
      },
      { status: 502 }
    );
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Place search returned ${response.status}.`,
        detail: detail.slice(0, 200)
      },
      { status: 502 }
    );
  }

  const data = (await response.json()) as MapboxResponse;
  const results: PlaceResult[] = (data.features ?? []).map((f) => {
    const country = extractCountry(f);
    const label = country ? `${f.text}, ${country}` : f.text;
    return { label, value: label };
  });

  return NextResponse.json({ results });
}
