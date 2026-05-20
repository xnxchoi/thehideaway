import configPromise from "@payload-config";
import { cookies } from "next/headers";
import { getPayload } from "payload";
import type { ReactNode } from "react";

import { DayNNightGate } from "@/components/sections/DayNNightGate";
import {
  eventGateCookieName,
  verifyEventGateCookieValue
} from "@/lib/event-gate";

const EVENT_SLUG = "day-n-night";

/**
 * Route-group layout for `/day-n-night/*`.
 *
 * Reads the HMAC-signed `event-gate.day-n-night` cookie on every request
 * and short-circuits to the gate component when it's missing or invalid.
 * All children — the landing, the guests page, future /my and /claim
 * sub-routes — sit behind this single check.
 *
 * The check is intentionally per-event (not per-route group) so the
 * cookie's HMAC binds to the event id. If the gate password rotates,
 * existing cookies stay valid until they expire, which matches how the
 * /tickets/[event] gate behaves today.
 */
export default async function DayNNightProtectedLayout({
  children
}: {
  children: ReactNode;
}) {
  const payload = await getPayload({ config: configPromise });

  const found = await payload
    .find({
      collection: "events",
      where: { slug: { equals: EVENT_SLUG } },
      limit: 1,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null);

  const event = found?.docs?.[0] as
    | { id: string; gate_password?: string | null }
    | undefined;

  // If the event row doesn't exist yet, or no gate password is set, leave
  // the surface open — the gate is opt-in by virtue of the password being
  // configured upstream in the admin. This prevents bricking the page if
  // the admin hasn't seeded the event row yet.
  if (!event || !event.gate_password) {
    return <>{children}</>;
  }

  const jar = await cookies();
  const cookieValue = jar.get(eventGateCookieName(EVENT_SLUG))?.value;
  const verified = verifyEventGateCookieValue(cookieValue, event.id);

  if (!verified) return <DayNNightGate />;
  return <>{children}</>;
}
