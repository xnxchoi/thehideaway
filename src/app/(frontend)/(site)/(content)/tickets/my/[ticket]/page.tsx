import { headers as nextHeaders } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketDetailClient } from "./page.client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const payload = await getPayload({ config });
  const headersList = await nextHeaders();
  const auth = await payload.auth({ headers: headersList });

  if (!auth.user) {
    redirect(`/login?redirect=/tickets/my/${ticketId}`);
  }

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
  if (idOf(ticket.user) !== String(auth.user.id)) notFound();

  const ev =
    typeof ticket.event === "object" && ticket.event ? ticket.event : null;

  const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? "";
  const checkInUrl = ticket.check_in_code
    ? `${baseUrl}/tickets/check-in/${ticket.check_in_code}`
    : "";

  return (
    <main className="mx-auto max-w-xl px-6 py-24" data-theme="dark">
      <Link
        href="/tickets/my"
        className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
      >
        ← All tickets
      </Link>

      <p className="mt-8 font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Ticket · #{ticket.ticket_number ?? "—"}
      </p>
      <h1 className="mt-3 text-2xl font-light tracking-tight xl:text-3xl">
        {ev?.name ?? "Event"}
      </h1>

      <TicketDetailClient
        ticketId={ticket.id}
        status={ticket.status ?? "pending"}
        paid={Boolean(ticket.paid)}
        checkedIn={Boolean(ticket.checked_in)}
        checkInUrl={checkInUrl}
        eventSlug={ev?.slug ?? ""}
        eventDate={ev?.date ?? null}
        eventLocation={ev?.location ?? null}
        ticketPrice={ev?.ticket_price ?? 0}
        tossId={ev?.toss_payment_id ?? null}
      />
    </main>
  );
}
