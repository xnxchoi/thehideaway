import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";

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

const formatDate = (d: string | null | undefined): string | null => {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return d;
  }
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
    <main className="mx-auto max-w-3xl px-6 py-24" data-theme="dark">
      <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
        Tickets
      </p>
      <h1 className="mt-3 text-3xl font-light tracking-tight xl:text-4xl">
        My tickets
      </h1>

      <div className="mt-12 border-t border-border/20 pt-8">
        {tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="mb-4 font-mono text-5xl opacity-10">○</span>
            <p className="text-base font-light text-foreground/70">
              No tickets yet
            </p>
            <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
              When you purchase or claim a ticket, it'll show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tickets.map((t) => {
              const ev =
                typeof t.event === "object" && t.event
                  ? t.event
                  : { name: "Event", slug: "", date: null, location: null };
              const status = t.status ?? "pending";
              const date = formatDate(ev.date ?? null);
              return (
                <li key={t.id}>
                  <Link
                    href={`/tickets/my/${t.id}`}
                    className="block rounded-sm border border-border/20 p-5 transition-colors hover:border-border/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
                          #{t.ticket_number ?? "—"}
                        </p>
                        <p className="mt-1 text-base font-light tracking-tight">
                          {ev.name}
                        </p>
                        {date ? (
                          <p className="mt-1 font-mono text-[11px] text-muted-foreground/60">
                            {date}
                            {ev.location ? ` · ${ev.location}` : ""}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`font-mono text-[10px] tracking-widest uppercase ${
                            status === "active"
                              ? "text-foreground/80"
                              : status === "pending"
                                ? "text-[oklch(0.7_0.15_85)]"
                                : "text-muted-foreground/50"
                          }`}
                        >
                          {status}
                        </span>
                        {t.checked_in ? (
                          <span className="font-mono text-[10px] tracking-widest text-[oklch(0.65_0.18_150)] uppercase">
                            Checked in
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
