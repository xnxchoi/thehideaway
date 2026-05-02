import { headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketDetailClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Ticket" };

type Params = Promise<{ ticket: string }>;

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

export default async function TicketDetailPage(props: { params: Params }) {
  const { ticket: ticketId } = await props.params;

  const session = await getServerSession(await nextHeaders());
  if (!session) {
    redirect(`/login?redirect=/tickets/my/${ticketId}`);
  }
  const payload = await getPayload({ config });

  const ticket = (await payload
    .findByID({
      collection: "tickets",
      id: ticketId,
      depth: 1,
      overrideAccess: true
    })
    .catch(() => null)) as {
    id: string;
    ticket_number?: number | null;
    status?: string | null;
    paid?: boolean | null;
    checked_in?: boolean | null;
    check_in_code?: string | null;
    user?: unknown;
    event?:
      | {
          id?: string;
          name?: string;
          slug?: string;
          date?: string | null;
          location?: string | null;
          ticket_price?: number | null;
          toss_payment_id?: string | null;
        }
      | string;
  } | null;

  if (!ticket) notFound();
  if (idOf(ticket.user) !== String(session.user.id)) notFound();

  const ev =
    typeof ticket.event === "object" && ticket.event ? ticket.event : null;

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "";
  const checkInUrl = ticket.check_in_code
    ? `${baseUrl}/tickets/check-in/${ticket.check_in_code}`
    : "";

  const u = session.user;
  const holderName = u.name?.trim()
    ? u.name
    : u.username?.trim()
      ? `@${u.username}`
      : (u.email ?? null);

  return (
    <TicketDetailClient
      ticketId={ticket.id}
      ticketNumber={ticket.ticket_number ?? null}
      status={
        (ticket.status ?? "pending") as
          | "pending"
          | "active"
          | "used"
          | "canceled"
      }
      paid={Boolean(ticket.paid)}
      checkedIn={Boolean(ticket.checked_in)}
      checkInUrl={checkInUrl}
      eventName={ev?.name ?? "Event"}
      eventSlug={ev?.slug ?? ""}
      eventDate={ev?.date ?? null}
      eventLocation={ev?.location ?? null}
      ticketPrice={ev?.ticket_price ?? 0}
      tossId={ev?.toss_payment_id ?? null}
      holderName={holderName}
    />
  );
}
