import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

/**
 * Postgres `nextval` helpers for monotonic, race-free numbering.
 *
 * Both sequences are created by migration
 * `20260512_120000_ticketing_money_resilience`. They're seeded past the
 * current max so legacy rows keep continuity.
 *
 * Why sequences instead of `max() + 1`:
 *   - `nextval` is atomic. Two concurrent callers always get distinct,
 *     monotonically increasing values; never a duplicate.
 *   - The value is reserved before commit, so even a rolled-back txn
 *     burns the number — fine for receipts (no number reuse) but means
 *     gaps are normal.
 *   - Survives replicas and connection pools without any app-layer
 *     coordination.
 */

type SequenceRow = { nextval: string };

async function nextSequence(payload: Payload, name: string): Promise<number> {
  const result = (await payload.db.drizzle.execute(
    sql.raw(`SELECT nextval('${name}') AS nextval`)
  )) as unknown;
  // node-postgres returns `{ rows: [...] }`; some Drizzle adapters surface
  // the rows directly as an array. Normalize defensively.
  const rows =
    (result as { rows?: SequenceRow[] })?.rows ?? (result as SequenceRow[]);
  const raw = rows?.[0]?.nextval;
  if (raw === undefined || raw === null) {
    throw new Error(`[sequences] '${name}' returned no nextval`);
  }
  // Postgres returns bigint as a string to preserve precision. Parse to
  // a JS number — safe up to 2^53; we'll never hit that for ticket /
  // invoice numbering on this platform.
  const parsed = typeof raw === "string" ? parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`[sequences] '${name}' returned non-numeric '${raw}'`);
  }
  return parsed;
}

export function nextTicketNumber(payload: Payload): Promise<number> {
  return nextSequence(payload, "tickets_number_seq");
}

export function nextInvoiceNumber(payload: Payload): Promise<number> {
  return nextSequence(payload, "invoices_number_seq");
}

interface TxnSession {
  db: { execute: (q: unknown) => Promise<unknown> };
}

function advisoryLockKey(value: string): string {
  // 64-bit FNV-1a — deterministic, fast, fits in a Postgres bigint.
  // Constants written via BigInt() constructor so this compiles under
  // targets older than ES2020 (the repo's current tsconfig).
  const FNV_OFFSET = BigInt("0xcbf29ce484222325");
  const FNV_PRIME = BigInt("0x100000001b3");
  const MASK_64 = BigInt("0xffffffffffffffff");
  const SIGNED_MAX = BigInt("0x7fffffffffffffff");
  const SIGNED_RANGE = BigInt("0x10000000000000000");

  let hash = FNV_OFFSET;
  for (let i = 0; i < value.length; i++) {
    hash ^= BigInt(value.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  return (hash > SIGNED_MAX ? hash - SIGNED_RANGE : hash).toString();
}

async function transactionAdvisoryLock(
  payload: Payload,
  transactionID: string | number,
  key: string
): Promise<void> {
  const sessions = (
    payload.db as unknown as { sessions: Record<string, TxnSession> }
  ).sessions;
  const session = sessions[String(transactionID)];
  if (!session) {
    throw new Error(
      `[transactionAdvisoryLock] no active session for transactionID ${transactionID}`
    );
  }
  await session.db.execute(
    sql.raw(`SELECT pg_advisory_xact_lock(${key}::bigint)`)
  );
}

/**
 * Postgres transaction-scoped advisory lock. Keyed by a 64-bit signed
 * integer derived from the event id. Multiple holders are queued; the
 * lock auto-releases on transaction commit or rollback.
 *
 * Used by the purchase route to serialize concurrent purchases for the
 * SAME event — closes the capacity TOCTOU without locking the whole
 * `tickets` table. Different events get different keys and don't
 * contend.
 *
 * MUST be called inside a Payload transaction. The lock has to run on
 * the same Postgres connection as the txn, which is why we go through
 * `payload.db.sessions[transactionID].db` rather than the default
 * `drizzle` handle.
 */
export async function eventPurchaseLock(
  payload: Payload,
  transactionID: string | number,
  eventId: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`event:${eventId}`)
  );
}

/**
 * Serializes LOSTINSEOUL standard-product reservations for one product.
 * Held until transaction commit/rollback. Different products do not contend.
 */
export async function productInventoryLock(
  payload: Payload,
  transactionID: string | number,
  productId: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`product:${productId}`)
  );
}

/**
 * Serializes every mutation of one relational product SKU. Product-level
 * inventory locks, when also needed, must be acquired before this lock.
 */
export async function productSkuMutationLock(
  payload: Payload,
  transactionID: string | number,
  skuId: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`product-sku:${skuId}`)
  );
}

/**
 * Serializes replacement of one user's active cart for one storefront.
 * Held across authoritative line resolution, lookup, and persistence.
 */
export async function productCartLock(
  payload: Payload,
  transactionID: string | number,
  userId: string,
  storefront: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`product-cart:${userId}:${storefront}`)
  );
}

/**
 * Serializes paid commitment transitions for a single request-to-order
 * campaign. Held until transaction commit/rollback.
 */
export async function campaignCommitmentLock(
  payload: Payload,
  transactionID: string | number,
  campaignId: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`campaign:${campaignId}`)
  );
}

/**
 * Serializes provider webhook processing for one commerce order reference.
 * This keeps duplicate-event checks and event append/update in one critical
 * section even when the provider retries concurrently.
 */
export async function paymentWebhookLock(
  payload: Payload,
  transactionID: string | number,
  orderRef: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`payment-webhook:${orderRef}`)
  );
}

/**
 * Serializes durable commerce-command work for one command or business
 * identity. Callers take the command identity first, then the business identity,
 * so different idempotency keys cannot race the same permanent operation. The
 * lock is transaction-scoped and never spans work after a claim commits.
 */
export async function commerceCommandLock(
  payload: Payload,
  transactionID: string | number,
  commandKey: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`commerce-command:${commandKey}`)
  );
}

/** Serializes permanent inventory movement idempotency for one command key. */
export async function inventoryMovementIdempotencyLock(
  payload: Payload,
  transactionID: string | number,
  idempotencyKey: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`inventory-movement:${idempotencyKey}`)
  );
}

/** Serializes validation of an explicit stock location during a movement. */
export async function inventoryLocationLock(
  payload: Payload,
  transactionID: string | number,
  locationId: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`inventory-location:${locationId}`)
  );
}

/** Serializes one SKU/location/disposition projection aggregate. */
export async function inventoryAggregateLock(
  payload: Payload,
  transactionID: string | number,
  aggregateKey: string
): Promise<void> {
  await transactionAdvisoryLock(
    payload,
    transactionID,
    advisoryLockKey(`inventory-aggregate:${aggregateKey}`)
  );
}
