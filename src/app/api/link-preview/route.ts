import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 50 * 1024; // 50 KB
const TIMEOUT_MS = 8000;

function isBlockedHost(hostname: string): boolean {
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "0.0.0.0"
  )
    return true;

  const ipv4 = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [, a, b] = ipv4.map(Number);
    if (a === 10) return true; // 10.x.x.x
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16–31.x.x
    if (a === 192 && b === 168) return true; // 192.168.x.x
    if (a === 127) return true; // 127.x.x.x
    if (a === 169 && b === 254) return true; // 169.254.x.x (link-local)
    if (a === 0) return true; // 0.x.x.x
  }

  // Block .local / .internal / .localhost TLDs
  if (/\.(local|internal|localhost|intranet)$/.test(hostname)) return true;

  return false;
}

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
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url")?.trim();

  if (!url) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json({ error: "Only http/https allowed" }, { status: 400 });
  }

  if (isBlockedHost(parsed.hostname)) {
    return NextResponse.json({ error: "Blocked host" }, { status: 400 });
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

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HideawayBot/1.0; +https://hideawayseoul.com)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      redirect: "follow"
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
    return NextResponse.json(empty, {
      headers: { "Cache-Control": "public, max-age=60" }
    });
  }
}
