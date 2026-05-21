/**
 * Soft-launch gate allowlist — single source of truth.
 *
 * Imported by the Next.js proxy (`src/proxy.ts`, the Next 16 successor
 * to `middleware.ts`) and, when added, the server-side role gate in
 * `(frontend)/(site)/layout.tsx`. Keep edge-runtime safe: no Node-only
 * imports, no Payload imports, no fs/path.
 */

export const GATE_PUBLIC_PATH_PREFIXES: readonly string[] = [
  "/day-n-night",
  "/tickets",
  "/api/tickets",
  "/api/auth",
  "/api/health",
  "/api/image-courier",
  "/api/places",
  "/gate",
  "/vault",
  "/dn-friends-torrent",
  "/ie-incompatible.html"
];

export const GATE_PUBLIC_PATHS: ReadonlySet<string> = new Set([
  "/favicon.ico",
  "/favicon.svg",
  "/robots.txt",
  "/sitemap.xml"
]);

export const GATE_STAFF_ROLES: ReadonlySet<string> = new Set([
  "editor",
  "cofounder",
  "admin"
]);

export function isGatePublicPath(pathname: string): boolean {
  if (GATE_PUBLIC_PATHS.has(pathname)) return true;
  for (const prefix of GATE_PUBLIC_PATH_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) return true;
  }
  return false;
}
