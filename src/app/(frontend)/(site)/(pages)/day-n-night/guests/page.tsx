import configPromise from "@payload-config";
import { cookies, headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import type { Metadata } from "next/types";

import { RPage } from "@/components/UX/Transition";
import { DayNNightGuests } from "@/components/sections/DayNNightGuests";
import type {
  GuestProfile,
  GuestGalleryItem
} from "@/components/sections/DayNNightGuests/types";
import type { Profile, User, UserMedia } from "@/payload-types";

export const metadata: Metadata = {
  title: "Day n Night — Guests",
  description:
    "RSVP'd guests for Day n Night, May 24, 2026. A small list, in no particular order."
};

/**
 * Server fetch shape for guests.
 *
 * Profile.rsvp is new — Payload types regenerate as part of the migration
 * rollout; until then, this local cast captures the shape Payload returns
 * for the new group + array.
 */
type ProfileWithRsvp = Profile & {
  rsvp?: {
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

  // Heuristic: a profile with rsvp.intro set is opted-in to the public guest
  // list. Defer the per-event scoping (rsvp.events relationship) until the
  // second event ships — see DAY_N_NIGHT.md § 7.1.
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

  // Map to the narrow GuestProfile shape the client renders against.
  // Skip rows where the author relation didn't resolve (orphaned profile).
  const guests: GuestProfile[] = docs
    .map((p): GuestProfile | null => {
      const author = typeof p.author === "object" ? (p.author as User) : null;
      if (!author) return null;

      const intro = p.rsvp?.intro?.trim();
      if (!intro) return null;

      const gallery: GuestGalleryItem[] = (p.rsvp?.gallery ?? [])
        .map((row): GuestGalleryItem | null => {
          const media =
            typeof row?.media === "object" ? (row.media as UserMedia) : null;
          if (!media) return null;
          return {
            id: row.id ?? media.id,
            media
          };
        })
        .filter((row): row is GuestGalleryItem => row !== null);

      const displayName =
        author.displayUsername ?? author.name ?? author.slug ?? "—";

      return {
        profileId: p.id,
        authorId: author.id,
        slug: author.slug ?? null,
        displayName,
        portrait: author.image ?? null,
        intro,
        igHandle: p.rsvp?.igHandle?.trim() || null,
        gallery
      };
    })
    .filter((row): row is GuestProfile => row !== null);

  // Stable shuffle by id so the order feels "in no particular order" but
  // doesn't change every refresh. Hash-sort: simple deterministic shuffle.
  guests.sort((a, b) => hash(a.profileId) - hash(b.profileId));

  // Current viewer id for the confetti-gate ("that's you" condition).
  const viewerId = await resolveViewerId(payload);

  return (
    <RPage type="pages" slug={["day-n-night", "guests"]}>
      <DayNNightGuests guests={guests} viewerId={viewerId} />
    </RPage>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

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
