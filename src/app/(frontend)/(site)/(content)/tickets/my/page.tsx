import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { Link } from "@/components/core/Link/Link";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketStub } from "@/components/UX/Ticket/TicketStub";
import { getServerSession } from "@/lib/auth/getServerSession";
import { RPage } from "@/components/UX/Transition";

type TicketDoc = {
  id: string;
  ticket_number?: number | null;
  status?: string | null;
  paid?: boolean | null;
  checked_in?: boolean | null;
  event?:
    | {
        id?: string;
        name?: string;
        slug?: string;
        date?: string | null;
        location?: string | null;
      }
    | string;
};

const PAGE_CONTAINER: React.CSSProperties = {
  width: "100%",
  maxWidth: "var(--maxContainerWidth, 1440px)",
  ["--ticket-page-bg" as string]: "var(--background)"
};

export default async function MyTicketsPage() {
  const session = await getServerSession(await nextHeaders());
  if (!session) {
    redirect("/login?redirect=/tickets/my");
  }

  const payload = await getPayload({ config });
  const userId = String(session.user.id);
  const found = await payload.find({
    collection: "tickets",
    where: { user: { equals: userId } },
    depth: 1,
    limit: 200,
    sort: "-createdAt",
    overrideAccess: true
  });
  const tickets = (found?.docs ?? []) as TicketDoc[];

  const activeCount = tickets.filter(
    (t) => t.status === "active" || t.status === "pending"
  ).length;
  const usedCount = tickets.filter(
    (t) => t.status === "used" || t.checked_in
  ).length;

  return (
    <RPage type="pages" slug={["tickets", "my"]}>
      <div
        className="mx-auto px-6 py-20 sm:px-10 lg:px-16 2xl:px-20"
        style={PAGE_CONTAINER}
      >
        <Link
          href="/"
          className="inline-block font-mono text-[10px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
        >
          ← Hideaway
        </Link>

        <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-16 xl:gap-24">
          {/* Left rail — title + meta. Sticky on desktop so it anchors as you scroll. */}
          <header className="lg:sticky lg:top-24 lg:self-start">
            <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
              Tickets
            </p>
            <h1 className="mt-3 text-4xl font-light tracking-tight xl:text-5xl 2xl:text-6xl">
              My tickets
            </h1>
            <p
              className="mt-6 font-mono text-[11px] leading-relaxed text-muted-foreground/60"
              style={{ width: "min(34ch, 100%)" }}
            >
              Each ticket is bound to your account. Open one to find its QR
              code, payment status, and any post-event content.
            </p>

            {tickets.length > 0 ? (
              <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-border/20 pt-6">
                <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                  Total
                </dt>
                <dd className="font-mono text-sm text-foreground/80 tabular-nums">
                  {String(tickets.length).padStart(2, "0")}
                </dd>
                <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                  Upcoming
                </dt>
                <dd className="font-mono text-sm text-foreground/80 tabular-nums">
                  {String(activeCount).padStart(2, "0")}
                </dd>
                <dt className="font-mono text-[10px] tracking-widest text-muted-foreground/50 uppercase">
                  Past
                </dt>
                <dd className="font-mono text-sm text-foreground/80 tabular-nums">
                  {String(usedCount).padStart(2, "0")}
                </dd>
              </dl>
            ) : null}
          </header>

          {/* Right column — ticket stack */}
          <section className="min-w-0">
            {tickets.length === 0 ? (
              <div className="flex flex-col items-start py-10">
                <span className="mb-4 font-mono text-5xl opacity-10">○</span>
                <p className="text-base font-light text-foreground/70">
                  No tickets yet
                </p>
                <p
                  className="mt-1.5 font-mono text-[11px] text-muted-foreground/50"
                  style={{ width: "min(48ch, 100%)" }}
                >
                  Tickets arrive here once you purchase one through a private
                  event link or claim a gift sent to you.
                </p>
                <Link
                  href="/"
                  className="mt-7 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] tracking-widest text-foreground/80 uppercase transition-colors hover:border-border hover:text-foreground"
                >
                  Back to the Hideaway
                </Link>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 xl:gap-5">
                {tickets.map((t, i) => {
                  const ev =
                    typeof t.event === "object" && t.event
                      ? t.event
                      : {
                          name: "Event",
                          slug: "",
                          date: null,
                          location: null
                        };
                  const status = (t.status ?? "pending") as
                    | "pending"
                    | "active"
                    | "used"
                    | "canceled";
                  return (
                    <TicketStub
                      key={t.id}
                      href={`/tickets/my/${t.id}`}
                      ticketNumber={t.ticket_number ?? null}
                      status={status}
                      checkedIn={Boolean(t.checked_in)}
                      eventName={ev.name ?? "Event"}
                      eventDate={ev.date ?? null}
                      eventLocation={ev.location ?? null}
                      index={i}
                    />
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </RPage>
  );
}
