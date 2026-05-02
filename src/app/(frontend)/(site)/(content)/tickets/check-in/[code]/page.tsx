import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { CheckInClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ code: string }>;

export default async function CheckInPage(props: { params: Params }) {
  const { code } = await props.params;
  const session = await getServerSession(await nextHeaders());
  if (!session) {
    redirect(`/login?redirect=/tickets/check-in/${encodeURIComponent(code)}`);
  }

  const role = session.user.role;
  const isStaff = role === "admin" || role === "editor";

  const payload = await getPayload({ config });

  if (!isStaff) {
    return (
      <main className="mx-auto max-w-md px-6 py-32" data-theme="dark">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[oklch(0.7_0.18_30)] uppercase">
          Forbidden
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight">
          Only staff can check in attendees.
        </h1>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          If you&apos;re trying to use your own ticket, scroll down to the QR
          code on your ticket page — staff will scan it from there.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/tickets/my"
            className="font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:text-foreground"
          >
            ← My tickets
          </Link>
          <Link
            href="/"
            className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground/60 hover:text-foreground"
          >
            Hideaway home
          </Link>
        </div>
      </main>
    );
  }

  const found = await payload.find({
    collection: "tickets",
    where: { check_in_code: { equals: code } },
    limit: 1,
    depth: 1,
    overrideAccess: true
  });
  const ticket = found?.docs?.[0] as
    | {
        id: string;
        ticket_number?: number | null;
        status?: string | null;
        checked_in?: boolean | null;
        user?: unknown;
        event?: { name?: string; slug?: string } | string;
      }
    | undefined;

  if (!ticket) {
    return (
      <main className="mx-auto max-w-md px-6 py-32" data-theme="dark">
        <p className="font-mono text-[10px] tracking-[0.2em] text-[oklch(0.7_0.18_30)] uppercase">
          Not found
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight">
          No ticket matches this code.
        </h1>
        <div className="mt-8">
          <Link
            href="/vault/collections/tickets"
            className="font-mono text-[11px] uppercase tracking-widest text-foreground/80 hover:text-foreground"
          >
            Open Vault → Tickets
          </Link>
        </div>
      </main>
    );
  }

  const eventName =
    typeof ticket.event === "object" && ticket.event
      ? ((ticket.event as { name?: string }).name ?? "Event")
      : "Event";

  let userName = "—";
  if (
    typeof ticket.user === "string" ||
    (ticket.user && typeof ticket.user === "object")
  ) {
    const userId =
      typeof ticket.user === "string"
        ? ticket.user
        : (ticket.user as { id?: string } | null)?.id;
    if (userId) {
      const u = (await payload
        .findByID({
          collection: "users",
          id: userId,
          depth: 0,
          overrideAccess: true
        })
        .catch(() => null)) as {
        name?: string;
        username?: string;
        email?: string;
      } | null;
      userName = u?.name ?? u?.username ?? u?.email ?? "—";
    }
  }

  return (
    <CheckInClient
      code={code}
      ticketNumber={ticket.ticket_number ?? null}
      eventName={eventName}
      userName={userName}
      status={ticket.status ?? "pending"}
      alreadyCheckedIn={Boolean(ticket.checked_in)}
    />
  );
}
