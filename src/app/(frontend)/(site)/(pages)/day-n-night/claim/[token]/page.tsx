import configPromise from "@payload-config";
import { cookies, headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import type { Metadata } from "next/types";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RPage } from "@/components/UX/Transition";
import { signInRedirectPath } from "@/lib/routes/auth";
import { ClaimGate } from "./ClaimGate";

export const metadata: Metadata = {
  title: "Day n Night — Claim a ticket",
  robots: { index: false, follow: false }
};

/**
 * /day-n-night/claim/[token]
 *
 * Gift redemption endpoint. The recipient receives a URL containing the
 * ticket's `claim_token` (nanoid). To proceed, they enter the 48h order
 * password the purchaser shared with them. We do NOT validate / claim on
 * GET — we just resolve the ticket + its order to decide which state
 * the page should render in:
 *
 *   - token missing / invalid  → "not found" copy
 *   - parent order not yet paid → "this ticket has not been activated"
 *   - parent password expired   → expired copy (instruct to ask buyer)
 *   - ticket already claimed    → already-claimed copy
 *   - otherwise                 → render <ClaimGate /> for password entry
 *
 * The actual claim is a server action invoked by <ClaimGate /> that
 * constant-time compares the entered password against
 * `ticket-orders.password` and, on match, stamps `claimed_at`,
 * `claimed_by` (the current viewer or anonymous-claim email), and
 * clears `claim_token`.
 */

type TicketDoc = {
  id: string;
  claim_token?: string | null;
  claimed_at?: string | null;
  gift_initial_name?: string | null;
  ticket_number?: number | null;
  order?:
    | string
    | {
        id: string;
        paid?: boolean;
        password_expires_at?: string | null;
      }
    | null;
};

type OrderDoc = {
  id: string;
  paid?: boolean;
  password_expires_at?: string | null;
};

type ClaimState =
  | { kind: "not-found" }
  | { kind: "not-activated" }
  | { kind: "expired" }
  | { kind: "already-claimed" }
  | {
      kind: "ready";
      ticketId: string;
      orderId: string;
      recipientLabel: string;
    };

export default async function DayNNightClaimPage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("Event.Rsvp.claim");
  const payload = await getPayload({ config: configPromise });

  const viewerId = await resolveViewerId(payload);
  if (!viewerId) {
    redirect(
      signInRedirectPath(`/day-n-night/claim/${encodeURIComponent(token)}`)
    );
  }

  const state = await resolveClaim(token, payload);

  return (
    <RPage type="pages" slug={["day-n-night", "claim"]}>
      <main className="relative flex min-h-screen w-full items-center justify-center bg-off-black px-6 text-off-white">
        <div className="w-full max-w-md">
          <p className="mb-3 font-sans text-[10px] tracking-[0.32em] text-off-white/65 uppercase">
            {t("eyebrow")}
          </p>

          {state.kind === "ready" ? (
            <>
              <h1 className="font-wide text-4xl leading-[1.05] font-light tracking-tight xl:text-5xl">
                {state.recipientLabel || t("title")}
              </h1>
              <p className="mt-4 max-w-sm text-sm leading-relaxed font-light text-off-white/75">
                {t("body")}
              </p>
              <ClaimGate ticketId={state.ticketId} />
            </>
          ) : (
            <>
              <h1 className="font-wide text-3xl leading-[1.05] font-light tracking-tight xl:text-4xl">
                {state.kind === "not-found"
                  ? t("errors.invalid")
                  : state.kind === "not-activated"
                    ? t("errors.notActivated")
                    : state.kind === "expired"
                      ? t("errors.expired")
                      : t("errors.alreadyClaimed")}
              </h1>
            </>
          )}
        </div>
      </main>
    </RPage>
  );
}

async function resolveClaim(
  token: string,
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<ClaimState> {
  if (!token || token.length < 6 || token.length > 64) {
    return { kind: "not-found" };
  }

  const ticketSearch = await payload
    .find({
      collection: "tickets",
      depth: 1,
      limit: 1,
      overrideAccess: true,
      where: { claim_token: { equals: token } }
    })
    .catch(() => null);

  const ticket = ticketSearch?.docs?.[0] as TicketDoc | undefined;
  if (!ticket) return { kind: "not-found" };
  if (ticket.claimed_at) return { kind: "already-claimed" };

  let order: OrderDoc | null = null;
  if (typeof ticket.order === "string") {
    order = (await payload
      .findByID({
        collection: "ticket-orders",
        id: ticket.order,
        depth: 0,
        overrideAccess: true
      })
      .catch(() => null)) as OrderDoc | null;
  } else if (ticket.order && typeof ticket.order === "object") {
    order = ticket.order as OrderDoc;
  }

  if (!order || !order.paid) return { kind: "not-activated" };
  if (
    order.password_expires_at &&
    new Date(order.password_expires_at).getTime() <= Date.now()
  ) {
    return { kind: "expired" };
  }

  return {
    kind: "ready",
    ticketId: ticket.id,
    orderId: order.id,
    recipientLabel: ticket.gift_initial_name?.trim() || ""
  };
}

async function resolveViewerId(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await nextHeaders();
    const headersForPayload = new Headers(headerStore);
    const token = cookieStore.get("payload-token")?.value;
    if (token && !headersForPayload.get("authorization")) {
      headersForPayload.set("authorization", `JWT ${token}`);
    }
    const { user } = await payload.auth({ headers: headersForPayload });
    return user?.id ?? null;
  } catch {
    return null;
  }
}
