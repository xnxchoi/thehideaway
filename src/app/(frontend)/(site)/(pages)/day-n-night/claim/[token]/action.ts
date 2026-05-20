"use server";

import configPromise from "@payload-config";
import { cookies, headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import { revalidatePath } from "next/cache";

import { safeEqual } from "@/lib/api/safeEqual";

export type ClaimActionState = {
  ok: boolean;
  error?: "invalid" | "expired" | "alreadyClaimed" | "not-found";
};

/**
 * Claim a gift ticket using the 48h order password.
 *
 * Steps:
 *   1. Look up the ticket by id with overrideAccess (we already
 *      authenticated the *visitor* via the event gate at the layout
 *      level; this is the second-factor — knowing the password).
 *   2. Reject if already claimed.
 *   3. Resolve the parent order; reject if not paid, missing
 *      password, or expired.
 *   4. Constant-time compare against the order password.
 *   5. On match, stamp `claimed_at`, clear `claim_token`, and (if a
 *      viewer is signed in) wire `user = viewer.id` so the ticket
 *      becomes theirs in /tickets/my.
 */
export async function submitClaim(
  _prev: ClaimActionState | undefined,
  formData: FormData
): Promise<ClaimActionState> {
  const ticketIdRaw = formData.get("ticketId");
  const passwordRaw = formData.get("password");
  const ticketId = typeof ticketIdRaw === "string" ? ticketIdRaw.trim() : "";
  const password = typeof passwordRaw === "string" ? passwordRaw.trim() : "";
  if (!ticketId || !password) return { ok: false, error: "invalid" };

  const payload = await getPayload({ config: configPromise });

  const ticket = (await payload
    .findByID({
      collection: "tickets",
      id: ticketId,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as {
    id: string;
    order?: string | null;
    claimed_at?: string | null;
    claim_token?: string | null;
  } | null;

  if (!ticket) return { ok: false, error: "not-found" };
  if (ticket.claimed_at) return { ok: false, error: "alreadyClaimed" };

  const orderId =
    typeof ticket.order === "string" ? ticket.order : (ticket.order ?? null);
  if (!orderId) return { ok: false, error: "invalid" };

  const order = (await payload
    .findByID({
      collection: "ticket-orders",
      id: orderId,
      depth: 0,
      overrideAccess: true
    })
    .catch(() => null)) as {
    id: string;
    paid?: boolean;
    password?: string | null;
    password_expires_at?: string | null;
  } | null;

  if (!order || !order.paid || !order.password) {
    return { ok: false, error: "invalid" };
  }
  if (
    order.password_expires_at &&
    new Date(order.password_expires_at).getTime() <= Date.now()
  ) {
    return { ok: false, error: "expired" };
  }
  if (!safeEqual(password, order.password)) {
    return { ok: false, error: "invalid" };
  }

  // Resolve the viewer (optional). If signed in, bind the ticket to them.
  const viewerId = await resolveViewerId(payload);

  await payload.update({
    collection: "tickets",
    id: ticket.id,
    overrideAccess: true,
    data: {
      claimed_at: new Date().toISOString(),
      claim_token: null,
      ...(viewerId ? { user: viewerId } : {})
    } as Record<string, unknown>
  });

  revalidatePath("/day-n-night/my", "layout");
  return { ok: true };
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
