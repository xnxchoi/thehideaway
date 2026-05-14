import type { CollectionBeforeChangeHook } from "payload";
import { DateTime } from "luxon";

/**
 * Close the paid → active loop.
 *
 * The Subscriptions admin UI describes `paid` as the trigger ("Activating
 * triggers role sync"), but neither `syncRoleAfterSubscriptionChange` nor
 * `issueInvoiceOnPaid` actually fire on a `paid` edit alone — both gate
 * on `subscription_status === 'active'`. Without this hook, an admin
 * who ticks `paid: true` on a row that is still `subscription_status:
 * 'pending'` produces zero downstream effects (no role grant, no
 * invoice issuance).
 *
 * This hook auto-promotes the row inside the same write so both
 * afterChange hooks see a clean `previousDoc.status === 'pending' →
 * doc.status === 'active'` transition.
 *
 * Scope is intentionally narrow:
 *   - Only fires on the leading edge (`paid` going false → true).
 *   - Only fires while `subscription_status` is still `'pending'`.
 *   - Stamps `expires_at` from plan validity ONLY if not already set,
 *     so admin overrides survive.
 *
 * Reverse transitions (admin unchecks paid, or marks the row expired /
 * canceled) are out of scope — those are still operated manually via
 * the status field, which `syncRole` handles correctly.
 */

type PlanLike = {
  id: string;
  validity?: "yearly" | "lifetime" | null;
};

const computeExpiresAt = (
  startIso: string | undefined,
  validity: PlanLike["validity"]
): string | null => {
  if (validity === "lifetime") return null;
  // Default to yearly — Plans currently only ship with yearly | lifetime,
  // but treat any unrecognized value as yearly rather than null so we
  // never leak an unbounded-expiry row through this hook by accident.
  const start = startIso ? DateTime.fromISO(startIso) : DateTime.now();
  if (!start.isValid) return DateTime.now().plus({ years: 1 }).toISO();
  return start.plus({ years: 1 }).toISO();
};

const idOf = (rel: unknown): string | null => {
  if (typeof rel === "string") return rel;
  if (rel && typeof rel === "object" && "id" in rel) {
    const id = (rel as { id: unknown }).id;
    return typeof id === "string" ? id : null;
  }
  return null;
};

export const autoActivateOnPaid: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation
}) => {
  try {
    const nextPaid = data?.paid === true;
    const wasPaid = originalDoc?.paid === true;

    // Resolve the post-write status: prefer what the admin is writing,
    // fall back to the persisted value. `pending` covers both
    // (a) update of a still-pending row and (b) create of a new row
    // that defaults to pending.
    const nextStatus =
      (data?.subscription_status as string | undefined) ??
      (originalDoc?.subscription_status as string | undefined) ??
      "pending";

    const becamePaid = operation === "create" ? nextPaid : nextPaid && !wasPaid;

    if (!becamePaid) return data;
    if (nextStatus !== "pending") return data;

    // Auto-promote.
    data.subscription_status = "active";

    // Stamp expires_at if not already set (admin-set values win).
    const explicitExpires = data?.expires_at ?? originalDoc?.expires_at ?? null;
    if (!explicitExpires) {
      const planId = idOf(data?.plan ?? originalDoc?.plan);
      if (planId) {
        const plan = (await req.payload
          .findByID({
            collection: "plans",
            id: planId,
            depth: 0,
            overrideAccess: true
          })
          .catch(() => null)) as PlanLike | null;
        const startIso =
          (data?.start_date as string | undefined) ??
          (originalDoc?.start_date as string | undefined);
        data.expires_at = computeExpiresAt(startIso, plan?.validity);
      }
    }

    req.payload.logger.info?.(
      `[autoActivate] subscription ${originalDoc?.id ?? "(new)"} promoted to active (paid edge)`
    );
    return data;
  } catch (err) {
    req.payload.logger.error?.(
      `[autoActivate] failed for subscription ${originalDoc?.id ?? "(new)"}: ${(err as Error).message}`
    );
    return data;
  }
};
