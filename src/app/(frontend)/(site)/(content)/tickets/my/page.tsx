import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { TicketStub } from "@/components/UX/Ticket/TicketStub";

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

export default async function MyTicketsPage() {
  const payload = await getPayload({ config });
  const headersList = await nextHeaders();
  const auth = await payload.auth({ headers: headersList });

  if (!auth.user) {
    redirect("/login?redirect=/tickets/my");
  }

  const userId = String(auth.user.id);
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
    <main
      className="mx-auto max-w-2xl px-6 py-24"
      data-theme="dark"
      style={
        { ["--ticket-page-bg" as string]: "var(--background)" } as React.CSSProperties
      }
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/60">
        Tickets
      </p>
      <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-4xl">
        My tickets
      </h1>

      <div className="mt-12 border-t border-border/20 pt-8">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="mb-4 font-mono text-5xl opacity-10">○</span>
            <p className="text-base font-light text-foreground/70">
              No tickets yet
            </p>
            <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
              When you purchase or claim a ticket, it&apos;ll show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
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
    </main>
  );
}
