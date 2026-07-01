type BrowserLocation = {
  hostname: string;
  origin: string;
};

const LOSTINSEOUL_HOSTS = new Set(["lostinseoul.com", "www.lostinseoul.com"]);

const DEFAULT_AUTH_ORIGINS = [
  "https://lostinseoul.com",
  "https://www.lostinseoul.com"
];

function isLostInSeoulHost(hostname: string): boolean {
  return LOSTINSEOUL_HOSTS.has(hostname.toLowerCase());
}

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function currentBrowserLocation(
  override?: BrowserLocation
): BrowserLocation | null {
  if (override) return override;
  if (typeof window === "undefined") return null;
  return window.location;
}

export function readAuthBaseURL(locationOverride?: BrowserLocation): string {
  const primary =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    "";
  const location = currentBrowserLocation(locationOverride);
  if (!location) return primary;

  if (isLostInSeoulHost(location.hostname)) return location.origin;

  const candidates = [
    primary,
    process.env.NEXT_PUBLIC_SERVER_URL,
    process.env.NEXT_PUBLIC_LOSTINSEOUL_URL,
    process.env.NEXT_PUBLIC_PRODUCTION_URL,
    ...DEFAULT_AUTH_ORIGINS
  ];

  for (const candidate of candidates) {
    if (originOf(candidate) === location.origin) return location.origin;
  }

  return primary || location.origin;
}

