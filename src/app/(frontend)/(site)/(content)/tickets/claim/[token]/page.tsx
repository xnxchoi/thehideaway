import { headers as nextHeaders } from "next/headers";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { ClaimClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = Promise<{ token: string }>;

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

export default async function ClaimPage(props: { params: Params }) {
  const { token } = await props.params;
  const session = await getServerSession(await nextHeaders());
  const payload = await getPayload({ config });

  const found = await payload
    .find({
      collection: "tickets",
      where: { claim_token: { equals: token } },
      limit: 1,
      depth: 1,
      overrideAccess: true
    })
    .catch(() => null);

  const ticket = found?.docs?.[0] as
    | {
        id: string;
        event?:
          | {
              id?: string;
              name?: string;
              slug?: string;
              date?: string;
              location?: string;
            }
          | string;
        user?: unknown;
        claim_email?: string | null;
      }
    | undefined;

  if (!ticket) {
    return (
      <main
        className="px-6 py-32 sm:px-10 lg:px-16 2xl:px-24"
        data-theme="dark"
      >
        <p className="font-mono text-[10px] tracking-[0.2em] text-muted-foreground/60 uppercase">
          Gift ticket
        </p>
        <h1 className="mt-3 text-2xl font-light tracking-tight">
          Link is invalid or already claimed.
        </h1>
        <p className="mt-3 font-mono text-[11px] text-muted-foreground/60">
          If you think this is a mistake, ask the sender to resend.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          {session ? (
            <Link
              href="/tickets/my"
              className="font-mono text-[11px] tracking-widest text-foreground/80 uppercase hover:text-foreground"
            >
              ← My tickets
            </Link>
          ) : null}
          <Link
            href="/"
            className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase hover:text-foreground"
          >
            Hideaway home
          </Link>
        </div>
      </main>
    );
  }

  const eventInfo =
    typeof ticket.event === "object" && ticket.event
      ? {
          name: ticket.event.name ?? "Event",
          slug: ticket.event.slug ?? "",
          date: ticket.event.date ?? null,
          location: ticket.event.location ?? null
        }
      : { name: "Event", slug: "", date: null, location: null };

  const isAuthenticated = Boolean(session);
  const userEmail = session?.user?.email ?? null;
  const alreadyMine =
    idOf(ticket.user) === (session?.user?.id ? String(session.user.id) : null);
  const emailMismatch =
    Boolean(ticket.claim_email) &&
    Boolean(userEmail) &&
    ticket.claim_email!.trim().toLowerCase() !==
      (userEmail ?? "").trim().toLowerCase();

  return (
    <ClaimClient
      token={token}
      ticketId={ticket.id}
      event={eventInfo}
      isAuthenticated={isAuthenticated}
      alreadyMine={alreadyMine}
      emailRestricted={Boolean(ticket.claim_email)}
      emailMismatch={emailMismatch}
    />
  );
}
