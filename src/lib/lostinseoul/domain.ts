const LOST_HOSTS = ["lostinseoul.com", "www.lostinseoul.com"];
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
  "0.0.0.0"
]);
const INTERNAL_ROOT = "/lostinseoul";

function configuredHostname(configuredURL: string): string | null {
  try {
    const hostname = new URL(configuredURL).hostname.toLowerCase();
    return LOCAL_HOSTS.has(hostname) ? null : hostname;
  } catch {
    return null;
  }
}

/** Validate Host once so routing and redirect construction use identical parsing. */
export function lostHostAuthority(
  host: string | null | undefined,
  configuredURL = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL ?? ""
): string | null {
  if (!host) return null;
  const value = host.trim().toLowerCase();
  if (!/^(?:[a-z0-9.-]+|\[[0-9a-f:]+\])(?::[0-9]{1,5})?$/.test(value))
    return null;
  try {
    const url = new URL(`https://${value}`);
    if (
      !LOST_HOSTS.includes(url.hostname) &&
      url.hostname !== configuredHostname(configuredURL)
    )
      return null;
    return url.host;
  } catch {
    return null;
  }
}

export function isLostHost(
  host: string | null | undefined,
  configuredURL = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL ?? ""
): boolean {
  return lostHostAuthority(host, configuredURL) !== null;
}

// Next config redirects run before proxy rewrites. Keep legacy /auth redirects
// on the primary host while allowing the LOST storefront's own sign-in route.
export function lostHostRedirectPattern(
  configuredURL = process.env.NEXT_PUBLIC_LOSTINSEOUL_URL ?? ""
): string {
  const configured = configuredHostname(configuredURL);
  return [...LOST_HOSTS, ...(configured ? [configured] : [])]
    .map((host) => host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
}

/** Public page allowlist, shared by the server rewrite and storefront chrome. */
export function lostInternalPath(pathname: string): string | null {
  if (!pathname) return null;
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return INTERNAL_ROOT;
  if (
    /^\/(?:gate|privacy|terms|refund|fragrance|cart|checkout|policy)$/.test(
      path
    ) ||
    /^\/(?:products|collections|orders)\/[^/]+$/.test(path) ||
    /^\/policy\/(?:privacy|terms|refund)$/.test(path) ||
    /^\/payment\/(?:return|success|failure|pending)$/.test(path) ||
    path === "/auth/sign-in"
  )
    return `${INTERNAL_ROOT}${path}`;
  return null;
}

export function lostPublicHref(href: string, onLostHost: boolean): string {
  if (!onLostHost) return href;
  const boundary = href.search(/[?#]/);
  const pathname = boundary === -1 ? href : href.slice(0, boundary);
  const suffix = boundary === -1 ? "" : href.slice(boundary);
  if (pathname !== INTERNAL_ROOT && !pathname.startsWith(`${INTERNAL_ROOT}/`))
    return href;
  const publicPath = pathname.slice(INTERNAL_ROOT.length) || "/";
  return lostInternalPath(publicPath) ? `${publicPath}${suffix}` : href;
}

export function lostRoutePath(pathname: string, onLostHost: boolean): string {
  return onLostHost ? (lostInternalPath(pathname) ?? pathname) : pathname;
}
