/**
 * SSRF-defended fetch with manual redirect re-validation.
 *
 * The previous implementation used `redirect: "follow"`, which let an attacker
 * point a public URL at `169.254.169.254` (or any private IP) via a 302 and
 * have the server fetch it on their behalf. This helper follows redirects
 * manually, re-running the blocklist against each `Location` header.
 */

const DEFAULT_MAX_REDIRECTS = 5;

export function isBlockedHost(hostname: string): boolean {
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

  // Block all raw IPv6 literals — too easy to mis-parse, no business case for
  // following one from user-supplied URLs.
  if (bare.includes(":")) return true;

  if (/\.(local|internal|localhost|intranet)$/.test(host)) return true;

  return false;
}

export function isSafeUrl(url: URL): boolean {
  if (!["http:", "https:"].includes(url.protocol)) return false;
  if (isBlockedHost(url.hostname)) return false;
  return true;
}

export interface SafeFetchOptions extends Omit<RequestInit, "redirect"> {
  maxRedirects?: number;
}

/**
 * Fetch a URL with manual redirect handling and SSRF re-validation at every
 * hop. Throws an Error with `code: "blocked-host"` if any URL in the chain
 * fails `isSafeUrl`, or `code: "too-many-redirects"` if the chain is too
 * long.
 */
export async function safeFetch(
  initialUrl: string | URL,
  options: SafeFetchOptions = {}
): Promise<Response> {
  const { maxRedirects = DEFAULT_MAX_REDIRECTS, ...init } = options;

  let url = typeof initialUrl === "string" ? new URL(initialUrl) : initialUrl;
  if (!isSafeUrl(url)) {
    const err = new Error("Blocked host") as Error & { code?: string };
    err.code = "blocked-host";
    throw err;
  }

  for (let i = 0; i <= maxRedirects; i++) {
    const response = await fetch(url.toString(), {
      ...init,
      redirect: "manual"
    });

    if (response.status < 300 || response.status >= 400) {
      return response;
    }

    const location = response.headers.get("location");
    if (!location) return response;

    let next: URL;
    try {
      next = new URL(location, url);
    } catch {
      const err = new Error("Invalid redirect target") as Error & {
        code?: string;
      };
      err.code = "invalid-redirect";
      throw err;
    }

    if (!isSafeUrl(next)) {
      const err = new Error("Blocked host in redirect") as Error & {
        code?: string;
      };
      err.code = "blocked-host";
      throw err;
    }

    url = next;
  }

  const err = new Error("Too many redirects") as Error & { code?: string };
  err.code = "too-many-redirects";
  throw err;
}
