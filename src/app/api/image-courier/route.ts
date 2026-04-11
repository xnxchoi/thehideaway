import { NextRequest, NextResponse } from "next/server";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIMEOUT_MS = 10_000;
const ALLOWED_CONTENT_TYPE_PREFIX = "image/";

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host === "[::]"
  ) {
    return true;
  }

  // Strip brackets from IPv6 literals
  const bare = host.replace(/^\[|\]$/g, "");

  // IPv4 literal
  const ipv4 = bare.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4) {
    const [, aStr, bStr] = ipv4;
    const a = Number(aStr);
    const b = Number(bStr);
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
    if (a === 127) return true; // 127.0.0.0/8 (loopback)
    if (a === 169 && b === 254) return true; // 169.254.0.0/16 (link-local, AWS metadata)
    if (a === 0) return true; // 0.0.0.0/8
    if (a >= 224) return true; // multicast + reserved
    if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (CGNAT)
  }

  // IPv6: reject any literal containing a colon that isn't a well-known public form.
  // Simplest safe policy: block all raw IPv6 literals.
  if (bare.includes(":")) return true;

  // Block .local / .internal / .localhost / .intranet TLDs
  if (/\.(local|internal|localhost|intranet)$/.test(host)) return true;

  return false;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("Missing image URL", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new NextResponse("Invalid URL", { status: 400 });
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return new NextResponse("Only http/https allowed", { status: 400 });
  }

  if (isBlockedHost(parsed.hostname)) {
    return new NextResponse("Blocked host", { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(parsed.toString(), {
      method: "GET",
      headers: {
        Accept: "image/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; HideawayBot/1.0; +https://hideawayseoul.com)",
      },
      signal: controller.signal,
      redirect: "follow",
      cache: "force-cache",
      next: {
        revalidate: 24 * 7 * 3600,
      },
    });

    if (!response.ok) {
      return new NextResponse("Upstream fetch failed", { status: 502 });
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith(ALLOWED_CONTENT_TYPE_PREFIX)) {
      return new NextResponse("Unsupported content type", { status: 415 });
    }

    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      return new NextResponse("Image too large", { status: 413 });
    }

    // Stream with byte cap to defend against missing/false content-length.
    const reader = response.body?.getReader();
    if (!reader) {
      return new NextResponse("Empty response", { status: 502 });
    }

    const chunks: Uint8Array[] = [];
    let bytesRead = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytesRead += value.byteLength;
      if (bytesRead > MAX_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // ignore
        }
        return new NextResponse("Image too large", { status: 413 });
      }
      chunks.push(value);
    }

    const buffer = new Uint8Array(bytesRead);
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.byteLength;
    }

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse("Request timed out", { status: 504 });
    }
    console.error("Image proxy error:", error);
    return new NextResponse("Failed to fetch image", { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
