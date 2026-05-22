import configPromise from "@payload-config";
import { cookies, headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import type { Metadata } from "next/types";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { RPage } from "@/components/UX/Transition";
import { signInRedirectPath } from "@/lib/routes/auth";
import { PasswordReveal } from "./PasswordReveal";

// noindex,nofollow — this page renders the 48h order password as plain
// HTML; do not let it land in any search cache. Audit ref H3.
export const metadata: Metadata = {
  title: "Day n Night — Your tickets",
  robots: { index: false, follow: false }
};

/**
 * /day-n-night/my
 *
 * Purchaser dashboard. Lists the current viewer's TicketOrders along
 * with sibling Tickets. Surfaces the 48h password to the purchaser
 * exactly once (after admin marks paid) — it's not echoed in the admin
 * UI by design, only here.
 *
 * Gating: the surrounding /day-n-night layout already enforces the
 * event-gate cookie. This page additionally requires sign-in (you can't
 * see "your tickets" anonymously).
 *
 * NOTE: First-pass scaffold. Real 4-step purchase flow + claim flow
 * land in later passes; this surface is rendered as soon as the order
 * + ticket rows exist.
 */
export default async function DayNNightMyPage() {
  const t = await getTranslations("Event.Rsvp.my");
  const payload = await getPayload({ config: configPromise });

  const viewer = await resolveViewer(payload);
  if (!viewer) {
    redirect(signInRedirectPath("/day-n-night/my"));
  }

  // C5: distinguish a DB outage (`orders === null`) from a genuinely
  // empty list. The previous .catch(() => null) silently degraded both
  // into the same "empty" view, leading the user to believe their
  // orders vanished. Now we surface the outage explicitly via the
  // dedicated `t("outage")` copy below.
  const orders = await payload
    .find({
      collection: "ticket-orders",
      depth: 1,
      limit: 50,
      overrideAccess: false, // honour collection access rule (purchaser-only)
      where: { purchaser: { equals: viewer.id } },
      sort: "-createdAt"
    })
    .catch((err) => {
      payload.logger?.error?.(
        `[day-n-night/my] ticket-orders find failed for viewer ${viewer.id}: ${(err as Error).message}`
      );
      return null;
    });

  const orderIds = (orders?.docs ?? []).map((o) => (o as { id: string }).id);
  const tickets = orderIds.length
    ? await payload
        .find({
          collection: "tickets",
          depth: 1,
          limit: 200,
          overrideAccess: true,
          where: { order: { in: orderIds } },
          sort: "createdAt"
        })
        .catch(() => null)
    : null;

  const ticketsByOrder = new Map<string, Array<Record<string, unknown>>>();
  for (const tk of tickets?.docs ?? []) {
    const oid =
      typeof (tk as { order?: { id?: string } | string }).order === "string"
        ? (tk as { order: string }).order
        : ((tk as { order?: { id?: string } }).order?.id ?? null);
    if (!oid) continue;
    const list = ticketsByOrder.get(oid) ?? [];
    list.push(tk as unknown as Record<string, unknown>);
    ticketsByOrder.set(oid, list);
  }

  return (
    <RPage type="pages" slug={["day-n-night", "my"]}>
      <main className="relative min-h-screen w-full bg-off-black text-off-white">
        {/* H13: max-w-2xl (was 3xl) — a list, but related to the
            max-w-md single-action gate/claim screens. */}
        <div className="mx-auto max-w-2xl px-6 py-24 xl:px-10 xl:py-28">
          <p className="mb-3 font-mono text-[10px] tracking-[0.32em] text-off-white/65 uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="font-wide text-4xl leading-[1.05] font-light tracking-tight xl:text-5xl">
            {t("title")}
          </h1>

          {orders === null ? (
            // C5: explicit outage state. Distinct copy + role=alert so
            // assistive tech announces the failure instead of confusing
            // a DB outage with "no orders on this account".
            <p
              role="alert"
              className="mt-12 text-sm font-light text-off-white/75"
            >
              {t("outage")}
            </p>
          ) : orders.docs.length === 0 ? (
            <p className="mt-12 text-sm font-light text-off-white/70">
              {t("empty")}
            </p>
          ) : (
            <ul className="mt-12 flex flex-col gap-10">
              {orders.docs.map((order) => {
                const o = order as {
                  id: string;
                  paid?: boolean;
                  password?: string | null;
                  password_expires_at?: string | null;
                };
                const siblings = ticketsByOrder.get(o.id) ?? [];
                return (
                  <li
                    key={o.id}
                    className="rounded-2xl border border-off-white/10 bg-off-white/[0.03] p-7 xl:p-9"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-mono text-[10px] tracking-[0.32em] text-off-white/55 uppercase">
                        {o.paid ? t("confirmed") : t("pending")}
                      </span>
                      {/* H14: opacity bumped from /35 to /55 — clears
                          the legibility floor for informative UI text. */}
                      <span className="font-mono text-[10px] tracking-[0.32em] text-off-white/55 uppercase">
                        {t("ticketCount", { count: siblings.length })}
                      </span>
                    </div>

                    {o.paid && o.password ? (
                      <div className="mt-5">
                        <p className="font-mono text-[10px] tracking-[0.32em] text-off-white/65 uppercase">
                          {t("orderPassword")}
                        </p>
                        {/* H3: tap-to-reveal — the password stays
                            blurred + non-selectable until the user
                            clicks the toggle. */}
                        <PasswordReveal password={o.password} />
                        {/* H14: opacity bumped from /45 to /65 (and
                            tracking-widest is unchanged) so the
                            passwordHint copy clears the floor. */}
                        <p className="mt-2 max-w-md font-mono text-[10px] leading-relaxed tracking-widest text-off-white/65 uppercase">
                          {t("passwordHint")}
                        </p>
                      </div>
                    ) : null}

                    <ul className="mt-6 flex flex-col gap-3">
                      {siblings.map((tk) => {
                        const ticket = tk as {
                          id: string;
                          ticket_number?: number | null;
                          gift_initial_name?: string | null;
                          claimed_at?: string | null;
                          claim_token?: string | null;
                        };
                        const claimed = Boolean(ticket.claimed_at);
                        return (
                          <li
                            key={ticket.id}
                            className="flex items-center justify-between gap-4 border-t border-off-white/10 pt-3 text-sm font-light"
                          >
                            <span>
                              {ticket.gift_initial_name?.trim() ||
                                `#${ticket.ticket_number ?? "—"}`}
                            </span>
                            <span className="font-mono text-[10px] tracking-widest text-off-white/55 uppercase">
                              {claimed ? t("claimed") : t("unclaimed")}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </RPage>
  );
}

async function resolveViewer(
  payload: Awaited<ReturnType<typeof getPayload>>
): Promise<{ id: string } | null> {
  try {
    const cookieStore = await cookies();
    const headerStore = await nextHeaders();
    const headersForPayload = new Headers(headerStore);
    const token = cookieStore.get("payload-token")?.value;
    if (token && !headersForPayload.get("authorization")) {
      headersForPayload.set("authorization", `JWT ${token}`);
    }
    const { user } = await payload.auth({ headers: headersForPayload });
    return user ? { id: user.id } : null;
  } catch {
    return null;
  }
}
