import { NextRequest, NextResponse } from "next/server";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { safeFetch } from "@/lib/api/safeFetch";

const MAX_BYTES = 50 * 1024; // 50 KB
const TIMEOUT_MS = 8000;

function extractMeta(html: string, property: string): string | null {
  // Match both attribute orderings
  return (
    html.match(
      new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    )?.[1] ??
    html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
        "i"
      )
    )?.[1] ??
    null
  );
}

function extractMetaName(html: string, name: string): string | null {
  return (
    html.match(
      new RegExp(
        `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
        "i"
      )
    )?.[1] ??
    html.match(
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
        "i"
      )
    )?.[1] ??
    null
  );
}

export async function GET(request: NextRequest) {
  const rl = await rateLimitOr429(request, "expensive");
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json(
      { error: "url parameter required" },
      { status: 400 }
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const empty = {
    url,
    title: null as string | null,
    description: null as string | null,
    image: null as string | null,
    siteName: null as string | null
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await safeFetch(parsed, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HideawayBot/1.0; +https://hideawayseoul.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      }
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(empty, {
        headers: { "Cache-Control": "public, max-age=60" }
      });
    }

    const reader = response.body?.getReader();
    if (!reader) {
      return NextResponse.json(empty);
    }

    let html = "";
    let bytesRead = 0;
    const decoder = new TextDecoder();

    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      html += decoder.decode(value, { stream: true });
      // Stop as soon as we have the <head> section
      if (html.toLowerCase().includes("</head>")) break;
    }

    try {
      reader.cancel();
    } catch {
      // ignore cancel errors
    }

    const ogTitle =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ??
      null;

    const ogDescription =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description") ??
      extractMetaName(html, "description") ??
      null;

    const ogImageRaw =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image") ??
      extractMeta(html, "twitter:image:src") ??
      null;

    const ogSiteName =
      extractMeta(html, "og:site_name") ??
      parsed.hostname.replace(/^www\./, "") ??
      null;

    let ogImage: string | null = null;
    if (ogImageRaw) {
      try {
        ogImage = new URL(ogImageRaw, url).href;
      } catch {
        ogImage = ogImageRaw;
      }
    }

    return NextResponse.json(
      {
        url,
        title: ogTitle?.trim() ?? null,
        description: ogDescription?.trim() ?? null,
        image: ogImage,
        siteName: ogSiteName?.trim() ?? null
      },
      { headers: { "Cache-Control": "public, max-age=3600, s-maxage=3600" } }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 504 });
    }
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === "blocked-host"
    ) {
      return NextResponse.json({ error: "Blocked host" }, { status: 400 });
    }
    return NextResponse.json(empty, {
      headers: { "Cache-Control": "public, max-age=60" }
    });
  }
}
