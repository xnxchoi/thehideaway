import { headers as nextHeaders } from "next/headers";
import type { Metadata } from "next";
import { getPayload } from "payload";
import config from "@payload-config";
import { ClaimClient } from "./page.client";
import { getServerSession } from "@/lib/auth/getServerSession";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Claim ticket" };

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
      <ClaimClient
        token={token}
        ticketId=""
        event={{
          name: "Gift ticket",
          slug: "",
          date: null,
          location: null
        }}
        isAuthenticated={Boolean(session)}
        alreadyMine={false}
        emailRestricted={false}
        emailMismatch={false}
        invalid
      />
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
      isAuthenticated={Boolean(session)}
      alreadyMine={alreadyMine}
      emailRestricted={Boolean(ticket.claim_email)}
      emailMismatch={emailMismatch}
    />
  );
}
