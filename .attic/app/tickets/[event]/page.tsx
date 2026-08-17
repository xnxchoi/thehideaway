import { cookies as nextCookies, headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "src/payload.config";
import { TicketEventClient } from "./page.client";
import { getServerSession } from "src/lib/auth/getServerSession";
import {
  eventGateCookieName,
  verifyEventGateCookieValue
} from "src/lib/event-gate";

export const metadata: Metadata = { title: "Tickets" };

type Params = Promise<{ event: string }>;
const STEP_FLOW_SLUG = "day-n-night";

type EventDoc = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  date?: string | null;
  end_date?: string | null;
  location?: string | null;
  capacity?: number | null;
  max_per_user?: number | null;
  ticket_price?: number | null;
  payment_instructions?: string | null;
  state?: string | null;
  gate_password?: string | null;
};

export default async function TicketEventPage(props: { params: Params }) {
  const { event: slug } = await props.params;

  const session = await getServerSession(await nextHeaders());
  const payload = await getPayload({ config });

  const found = await payload
    .find({
      collection: "events",
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 1,
      overrideAccess: true
    })
    .catch(() => null);

  const event = found?.docs?.[0] as EventDoc | undefined;
  if (!event) notFound();

  // Don't expose draft events to non-staff.
  const role = session?.user?.role;
  const isStaff = role === "admin" || role === "editor";
  if (event.state === "draft" && !isStaff) notFound();

  const eventAcceptsReservations = event.state === "open";
  const gateInitiallyOpen = !eventAcceptsReservations
    ? true
    : slug === STEP_FLOW_SLUG
      ? verifyEventGateCookieValue(
          (await nextCookies()).get(eventGateCookieName(slug))?.value,
          event.id
        )
      : !event.gate_password;

  if (slug === STEP_FLOW_SLUG && session?.user?.id) {
    const existingOrder = await payload
      .find({
        collection: "ticket-orders",
        where: {
          and: [
            { event: { equals: event.id } },
            { purchaser: { equals: String(session.user.id) } }
          ]
        },
        limit: 1,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null);

    if (existingOrder?.docs?.length) {
      redirect("/day-n-night/my");
    }
  }

  // Capacity remaining (don't fail if we can't compute).
  let remaining: number | null = null;
  if (event.capacity && event.capacity > 0) {
    const total = await payload
      .count({
        collection: "tickets",
        overrideAccess: true,
        where: {
          and: [
            { event: { equals: event.id } },
            { status: { in: ["pending", "active", "used"] } }
          ]
        }
      })
      .catch(() => null);
    if (total) {
      remaining = Math.max(0, event.capacity - (total.totalDocs ?? 0));
    }
  }

  return (
    <TicketEventClient
      event={{
        id: event.id,
        name: event.name,
        slug: event.slug,
        description: event.description ?? null,
        date: event.date ?? null,
        end_date: event.end_date ?? null,
        location: event.location ?? null,
        capacity: event.capacity ?? 0,
        max_per_user: event.max_per_user ?? 3,
        ticket_price: event.ticket_price ?? 0,
        payment_instructions: event.payment_instructions ?? null,
        state: event.state ?? "draft"
      }}
      remaining={remaining}
      isAuthenticated={Boolean(session)}
      sessionUserId={session?.user?.id ? String(session.user.id) : null}
      // Pre-fill the Day n Night RSVP flow from the session,
      // so an already-authenticated user just confirms rather than retypes.
      // Both null on a signed-out hit; the client step machine handles that.
      sessionEmail={session?.user?.email ?? null}
      sessionName={session?.user?.name ?? null}
      sessionFirstName={session?.user?.firstName ?? null}
      sessionLastName={session?.user?.lastName ?? null}
      gateInitiallyOpen={gateInitiallyOpen}
    />
  );
}
