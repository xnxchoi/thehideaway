import { headers as nextHeaders } from "next/headers";
import { Link } from "@/components/core/Link/Link";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketDetailClient } from "./page.client";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth/getServerSession";
import { RPage } from "@/components/UX/Transition";

const PAGE_CONTAINER: React.CSSProperties = {
  width: "100%",
  maxWidth: "var(--maxContainerWidth, 1440px)",
  ["--ticket-page-bg" as string]: "var(--background)"
};

type Params = Promise<{ ticket: string }>;

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

const formatLongDate = (d: string | null): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return d;
  }
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting payment",
  active: "Active",
  used: "Used",
  canceled: "Canceled"
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

  const status = (ticket.status ?? "pending") as
    | "pending"
    | "active"
    | "used"
    | "canceled";
  const dateLong = formatLongDate(ev?.date ?? null);
  const num = String(ticket.ticket_number ?? 0).padStart(4, "0");

  return (
    <RPage type="pages" slug={["tickets", "my", ticket.id]}>
      <div
        className="mx-auto px-6 pt-12 pb-24 sm:px-10 lg:px-16 2xl:px-20"
        style={PAGE_CONTAINER}
      >
        <Link
          href="/tickets/my"
          className="font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
        >
          ← All tickets
        </Link>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16 xl:gap-24">
          {/* Left rail — event metadata */}
          <header className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Ticket · No. {num}
            </p>
            <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-4xl 2xl:text-5xl">
              {ev?.name ?? "Event"}
            </h1>

            <dl className="mt-10 space-y-5 border-t border-border/20 pt-8">
              {dateLong ? (
                <div>
                  <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                    When
                  </dt>
                  <dd className="mt-1 text-sm font-light text-foreground/80">
                    {dateLong}
                  </dd>
                </div>
              ) : null}
              {ev?.location ? (
                <div>
                  <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                    Where
                  </dt>
                  <dd className="mt-1 text-sm font-light text-foreground/80">
                    {ev.location}
                  </dd>
                </div>
              ) : null}
              {holderName ? (
                <div>
                  <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                    Holder
                  </dt>
                  <dd className="mt-1 text-sm font-light text-foreground/80">
                    {holderName}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                  Status
                </dt>
                <dd className="mt-1 font-mono text-sm text-foreground/80 tabular-nums">
                  {STATUS_LABEL[status] ?? status}
                  {ticket.checked_in ? " · Checked in" : ""}
                </dd>
              </div>
            </dl>
          </header>

          {/* Right — the actual ticket artifact */}
          <section className="flex min-w-0 flex-col items-center lg:items-start">
            <TicketDetailClient
              ticketId={ticket.id}
              ticketNumber={ticket.ticket_number ?? null}
              status={status}
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
          </section>
        </div>
      </div>
    </RPage>
  );
}
