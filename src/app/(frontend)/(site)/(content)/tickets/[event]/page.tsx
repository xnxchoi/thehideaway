import { headers as nextHeaders } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketEventClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Tickets" };

type Params = Promise<{ event: string }>;

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
  toss_payment_id?: string | null;
  state?: string | null;
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
        toss_payment_id: event.toss_payment_id ?? null,
        state: event.state ?? "draft"
      }}
      remaining={remaining}
      isAuthenticated={Boolean(session)}
    />
  );
}
