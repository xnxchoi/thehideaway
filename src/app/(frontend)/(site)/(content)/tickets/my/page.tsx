import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketStub } from "@/components/UX/Ticket/TicketStub";
import { getServerSession } from "@/lib/auth/getServerSession";
import { RPage } from "@/components/UX/Transition";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  return (
    <RPage type="pages" slug={["tickets", "my"]} theme="dark">
      <div
        className="mx-auto px-6 py-20 sm:px-10 lg:px-16 2xl:px-20"
        style={PAGE_CONTAINER}
      >
        <Link
          href="/"
          className="inline-block font-mono text-[10px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
        >
          ← Hideaway
        </Link>

        <header className="mt-10 flex flex-col gap-1 border-b border-border/20 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
            Tickets
          </p>
          <h1 className="text-3xl font-light tracking-tight xl:text-4xl">
            My tickets
          </h1>
        </header>

        <div className="mt-10">
          {tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 font-mono text-5xl opacity-10">○</span>
              <p className="text-base font-light text-foreground/70">
                No tickets yet
              </p>
              <p
                className="mt-1.5 font-mono text-[11px] text-muted-foreground/50"
                style={{ width: "min(40ch, 100%)" }}
              >
                Tickets arrive here once you purchase one through a private
                event link or claim a gift sent to you.
              </p>
              <Link
                href="/"
                className="mt-7 inline-block border border-border/40 px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-foreground/80 transition-colors hover:border-border hover:text-foreground"
              >
                Back to the Hideaway
              </Link>
            </div>
          ) : (
            <ul
              className="grid gap-4 xl:gap-5"
              style={{
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))"
              }}
            >
              {tickets.map((t, i) => {
                const ev =
                  typeof t.event === "object" && t.event
                    ? t.event
                    : { name: "Event", slug: "", date: null, location: null };
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
        </div>
      </div>
    </RPage>
  );
}
