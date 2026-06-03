import { headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { ExclusiveContentClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";
import { signInRedirectPath } from "@/lib/routes/auth";

export const metadata: Metadata = { title: "Exclusive" };

type Params = Promise<{ event: string }>;

type EventDoc = {
  id: string;
  name: string;
  slug: string;
  date?: string | null;
  location?: string | null;
  exclusive_content?: unknown;
  exclusive_links?: Array<{
    label?: string;
    url?: string;
    type?: string;
  }> | null;
  goods_drop_enabled?: boolean | null;
};

export default async function ExclusivePage(props: { params: Params }) {
  const { event: slug } = await props.params;

  const session = await getServerSession(await nextHeaders());
  if (!session) {
    redirect(
      signInRedirectPath(`/tickets/${encodeURIComponent(slug)}/exclusive`)
    );
  }
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

  const userId = String(session.user.id);
  const ticketFound = await payload.find({
    collection: "tickets",
    where: {
      and: [
        { event: { equals: event.id } },
        { user: { equals: userId } },
        { checked_in: { equals: true } }
      ]
    },
    limit: 1,
    depth: 0,
    overrideAccess: true
  });

  const ticket = ticketFound?.docs?.[0] as
    | {
        id: string;
        delivery_address?: {
          recipient_name?: string | null;
          address?: string | null;
          phone?: string | null;
          submitted_at?: string | null;
        } | null;
      }
    | undefined;
  const isAttendee = Boolean(ticket);
  const exclusiveLinks = isAttendee
    ? (event.exclusive_links ?? [])
        .filter((l) => l && l.label && l.url)
        .map((l) => ({
          label: l.label!,
          url: l.url!,
          type: l.type ?? "link"
        }))
    : [];

  return (
    <ExclusiveContentClient
      eventName={event.name}
      eventSlug={event.slug}
      eventDate={event.date ?? null}
      eventLocation={event.location ?? null}
      isAttendee={isAttendee}
      exclusiveLinks={exclusiveLinks}
      goodsDropEnabled={isAttendee && Boolean(event.goods_drop_enabled)}
      ticketId={isAttendee ? (ticket?.id ?? null) : null}
      existingDelivery={isAttendee ? (ticket?.delivery_address ?? null) : null}
    />
  );
}
