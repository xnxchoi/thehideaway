"use client";

interface PlaceSearchResult {
  results: { label: string; value: string }[];
}

/**
 * Client-side helper that calls our `/api/places/search` proxy. The
 * proxy holds the Mapbox secret token and applies city-grade filtering
 * + per-session rate limiting; we only ever talk to it.
 *
 * Returns `{ results: [] }` on any error so the EditableLocation
 * combobox falls back gracefully — surfacing transient backend
 * failures inside an autocomplete combobox creates noise without
 * helping the user act.
 */
export async function searchPlaces(
  query: string
): Promise<PlaceSearchResult> {
  if (!query.trim()) return { results: [] };
  try {
    const r = await fetch(
      `/api/places/search?q=${encodeURIComponent(query.trim())}`,
      { cache: "no-store" }
    );
    if (!r.ok) return { results: [] };
    const data = (await r.json()) as PlaceSearchResult;
    return { results: data.results ?? [] };
  } catch {
    return { results: [] };
  }
}
