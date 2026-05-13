import { NextRequest, NextResponse } from "next/server";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { safeFetch } from "@/lib/api/safeFetch";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const TIMEOUT_MS = 10_000;
const ALLOWED_CONTENT_TYPE_PREFIX = "image/";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const rl = await rateLimitOr429(request, "expensive");
  if (rl) return rl;

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

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await safeFetch(parsed, {
      method: "GET",
      headers: {
        Accept: "image/*",
        "User-Agent":
          "Mozilla/5.0 (compatible; HideawayBot/1.0; +https://hideawayseoul.com)"
      },
      signal: controller.signal,
      cache: "force-cache",
      next: {
        revalidate: 24 * 7 * 3600
      }
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
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new NextResponse("Request timed out", { status: 504 });
    }
    if (
      error instanceof Error &&
      (error as Error & { code?: string }).code === "blocked-host"
    ) {
      return new NextResponse("Blocked host", { status: 400 });
    }
    console.error("Image proxy error:", error);
    return new NextResponse("Failed to fetch image", { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
