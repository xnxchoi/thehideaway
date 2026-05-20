import configPromise from "@payload-config";
import { cookies, headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import type { Metadata } from "next/types";

import { RPage } from "@/components/UX/Transition";
import { Credits, type Credited } from "@/components/sections/Credits";
import type { Profile, User, UserMedia } from "@/payload-types";
import type { RP_Roles } from "@/stores/Notification/NotificationStore";

export const metadata: Metadata = {
  title: "Day n Night — Guests",
  description:
    "RSVP'd guests for Day n Night, May 24, 2026. A small list, in no particular order."
};

/**
 * Day n Night — Guests page.
 *
 * Reuses the editorial `Credits` section to render the event's RSVP'd
 * guest list. Profiles with `rsvp.intro` set are the opt-in flag; their
 * `rsvp.tier` (host | past | guest) maps onto three of Credits' seven
 * role slots, so Credits' built-in empty-group filter does the work of
 * hiding the unused buckets while preserving display order
 * (Hosts → Past Attendees → Guests).
 *
 * The Credits `patronage` flag is repurposed here as the
 * "this row is *you*, the current viewer" signal — Credits fires
 * confetti on hover when patronage is true.
 */

type EventTier = "host" | "past" | "guest";

const TIER_TO_POSITION: Record<EventTier, RP_Roles> = {
  host: "admin",
  past: "cofounder",
  guest: "user"
};

const TIER_TITLES: Partial<Record<RP_Roles, string>> = {
  admin: "Hosts",
  cofounder: "Past Attendees",
  user: "Guests"
};

function normalizeTier(value: unknown): EventTier {
  return value === "host" || value === "past" ? value : "guest";
}

// Profile.rsvp is project-new; payload-generated-types may lag the
// migration. Local cast captures the shape until `pnpm generate:types`
// refreshes payload-types.ts.
type ProfileWithRsvp = Profile & {
  rsvp?: {
    tier?: EventTier | null;
    intro?: string | null;
    igHandle?: string | null;
    gallery?: Array<{
      id?: string | null;
      media?: string | UserMedia | null;
    }> | null;
  } | null;
};

export default async function DayNNightGuestsPage() {
  const payload = await getPayload({ config: configPromise });

  // Opt-in marker: any profile with a non-empty `rsvp.intro` is on the
  // public guest list. Per-event scoping (rsvp.events relationship)
  // is deferred until a second event ships — see DAY_N_NIGHT.md § 7.1.
  const profiles = await payload.find({
    collection: "profile",
    depth: 2,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { _status: { equals: "published" } },
        { "rsvp.intro": { exists: true } },
        { "rsvp.intro": { not_equals: "" } }
      ]
    }
  });

  const docs = profiles.docs as ProfileWithRsvp[];

  // Profile.author is configured with `maxDepth: 0`, so Payload returns
  // it as an id string regardless of the find query's depth. Resolve
  // authors in a single follow-up fetch and join in memory.
  const authorIds = Array.from(
    new Set(
      docs
        .map((p) => (typeof p.author === "string" ? p.author : p.author?.id))
        .filter((id): id is string => typeof id === "string")
    )
  );

  const authorsById = new Map<string, User>();
  if (authorIds.length > 0) {
    const users = await payload.find({
      collection: "users",
      depth: 0,
      limit: authorIds.length,
      overrideAccess: true,
      where: { id: { in: authorIds } }
    });
    for (const u of users.docs as User[]) authorsById.set(u.id, u);
  }

  const viewerId = await resolveViewerId(payload);

  // Map every RSVP'd profile into the `Credited` shape. Filter out
  // orphaned profiles (author resolution failed) and any row whose
  // intro went missing mid-pipeline.
  const people: Credited[] = docs
    .map((p): Credited | null => {
      const authorId =
        typeof p.author === "string" ? p.author : (p.author?.id ?? null);
      const author = authorId ? (authorsById.get(authorId) ?? null) : null;
      if (!author) return null;

      const intro = p.rsvp?.intro?.trim();
      if (!intro) return null;

      const tier = normalizeTier(p.rsvp?.tier);
      const position = TIER_TO_POSITION[tier];

      // Note: `Credited.role` is the raw site-role (a non-nullable
      // literal union on User). Credits itself groups by `position`,
      // not `role`, so this passes through unchanged for any
      // downstream consumer that wants the author's site-role.
      return {
        id: author.id,
        name: author.name ?? null,
        displayUsername: author.displayUsername ?? null,
        slug: author.slug ?? null,
        image: author.image ?? null,
        bio: intro,
        role: author.role,
        link: author.link ?? (author.slug ? `/@${author.slug}` : null),
        portrait: null,
        position,
        patronage: viewerId !== null && author.id === viewerId
      };
    })
    .filter((row): row is Credited => row !== null);

  return (
    <RPage type="pages" slug={["day-n-night", "guests"]}>
      <Credits people={people} titles={TIER_TITLES} />
    </RPage>
  );
}

/**
 * Resolve the current viewer's user id (or null when signed out).
 * Mirrors the cookie-token + headers handoff pattern Payload expects.
 */
async function resolveViewerId(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await nextHeaders();
    const headersForPayload = new Headers(headerStore);
    const token = cookieStore.get("payload-token")?.value;
    if (token && !headersForPayload.get("authorization")) {
      headersForPayload.set("authorization", `JWT ${token}`);
    }
    const { user } = await payload.auth({ headers: headersForPayload });
    return user?.id ?? null;
  } catch {
    return null;
  }
}
