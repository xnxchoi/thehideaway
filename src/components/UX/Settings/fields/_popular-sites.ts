/**
 * Curated list of "popular sites" surfaced by <EditableLink/>'s combobox.
 * The combobox uses cmdk's fuzzy match against `id`, `domain`, and any
 * keywords. Selecting a site pre-fills `https://${domain}/` so the user
 * just types their handle.
 *
 * Order matters — the combobox displays in this order before fuzzy
 * filtering. Keep the most-used sites near the top.
 */

export interface PopularSite {
  /** Stable identifier used for cmdk keyboard nav. */
  id: string;
  /** Visible label in the combobox. */
  label: string;
  /** Domain inserted into the URL prefix. */
  domain: string;
  /** Optional alternate keywords for fuzzy matching. */
  keywords?: string[];
}

export const POPULAR_SITES: PopularSite[] = [
  {
    id: "instagram",
    label: "Instagram",
    domain: "instagram.com",
    keywords: ["ig"]
  },
  { id: "x", label: "X", domain: "x.com", keywords: ["twitter"] },
  { id: "threads", label: "Threads", domain: "threads.net" },
  { id: "bluesky", label: "Bluesky", domain: "bsky.app" },
  { id: "mastodon", label: "Mastodon", domain: "mastodon.social" },
  { id: "github", label: "GitHub", domain: "github.com" },
  {
    id: "linkedin",
    label: "LinkedIn",
    domain: "linkedin.com/in",
    keywords: ["li"]
  },
  { id: "medium", label: "Medium", domain: "medium.com" },
  { id: "substack", label: "Substack", domain: "substack.com" },
  { id: "are-na", label: "Are.na", domain: "are.na" },
  { id: "vsco", label: "VSCO", domain: "vsco.co" },
  { id: "behance", label: "Behance", domain: "behance.net" },
  { id: "dribbble", label: "Dribbble", domain: "dribbble.com" },
  { id: "youtube", label: "YouTube", domain: "youtube.com/@" },
  { id: "vimeo", label: "Vimeo", domain: "vimeo.com" },
  { id: "soundcloud", label: "SoundCloud", domain: "soundcloud.com" },
  { id: "spotify", label: "Spotify", domain: "open.spotify.com/user" },
  {
    id: "tiktok",
    label: "TikTok",
    domain: "tiktok.com/@",
    keywords: ["tt"]
  },
  { id: "twitch", label: "Twitch", domain: "twitch.tv" }
];

/**
 * Build a clickable URL prefix from a popular site. The trailing slash
 * is intentional so the combobox can place the caret immediately after
 * it, ready for the user to type their handle.
 */
export function urlPrefixFor(site: PopularSite): string {
  return `https://${site.domain}/`;
}

/**
 * Match a full URL against the popular-sites list to figure out which
 * site (if any) the user previously selected. Used to pre-select an
 * entry in the combobox when the field has a saved value.
 */
export function matchSite(url: string): PopularSite | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return null;
  }
  return (
    POPULAR_SITES.find((s) => {
      // Match the registrable host portion of the site's domain. We use
      // startsWith on the bare hostname (drop the trailing path
      // fragment, e.g. `linkedin.com/in` -> `linkedin.com`).
      const siteHost = s.domain.split("/")[0]!;
      return host === siteHost || host.endsWith(`.${siteHost}`);
    }) ?? null
  );
}
