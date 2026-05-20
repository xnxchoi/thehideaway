import type { UserMedia } from "@/payload-types";

export type GuestGalleryItem = {
  id: string;
  media: UserMedia;
};

/** Ordering bucket on the public guest list. */
export type GuestTier = "host" | "past" | "guest";

/** Sort order for `GuestTier`. */
export const TIER_ORDER: Record<GuestTier, number> = {
  host: 0,
  past: 1,
  guest: 2
};

export type GuestProfile = {
  /** profile.id — used as the stable key per row. */
  profileId: string;
  /** user.id — used as the confetti-gate identity (`profile.author`). */
  authorId: string;
  /** user.slug — used for `/users/{slug}` deep links. */
  slug: string | null;
  /** Human-facing name shown in the list and the focus modal. */
  displayName: string;
  /** user.image (URL string) — the portrait shown in the list and focus. */
  portrait: string | null;
  /** rsvp.intro — already-trimmed, ≤200 chars. */
  intro: string;
  /** rsvp.igHandle — normalized (no leading @). */
  igHandle: string | null;
  /** rsvp.gallery — up to 5 resolved UserMedia. */
  gallery: GuestGalleryItem[];
  /** rsvp.tier — drives the three-tier ordering. */
  tier: GuestTier;
};
