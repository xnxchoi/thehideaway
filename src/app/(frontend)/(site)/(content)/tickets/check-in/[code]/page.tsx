import { headers as nextHeaders } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { CheckInClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Check in" };

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
    return <CheckInClient code={code} state="forbidden" />;
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
    return <CheckInClient code={code} state="not_found" />;
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
      state="ready"
      ticketNumber={ticket.ticket_number ?? null}
      eventName={eventName}
      userName={userName}
      status={ticket.status ?? "pending"}
      alreadyCheckedIn={Boolean(ticket.checked_in)}
    />
  );
}
