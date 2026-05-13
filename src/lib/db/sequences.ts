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
  // 64-bit FNV-1a — deterministic, fast, fits in a Postgres bigint.
  // Constants written via BigInt() constructor so this compiles under
  // targets older than ES2020 (the repo's current tsconfig).
  const FNV_OFFSET = BigInt("0xcbf29ce484222325");
  const FNV_PRIME = BigInt("0x100000001b3");
  const MASK_64 = BigInt("0xffffffffffffffff");
  const SIGNED_MAX = BigInt("0x7fffffffffffffff");
  const SIGNED_RANGE = BigInt("0x10000000000000000");

  let hash = FNV_OFFSET;
  for (let i = 0; i < eventId.length; i++) {
    hash ^= BigInt(eventId.charCodeAt(i));
    hash = (hash * FNV_PRIME) & MASK_64;
  }
  const signed = hash > SIGNED_MAX ? hash - SIGNED_RANGE : hash;

  const sessions = (
    payload.db as unknown as { sessions: Record<string, TxnSession> }
  ).sessions;
  const session = sessions[String(transactionID)];
  if (!session) {
    throw new Error(
      `[eventPurchaseLock] no active session for transactionID ${transactionID}`
    );
  }
  await session.db.execute(
    sql.raw(`SELECT pg_advisory_xact_lock(${signed.toString()}::bigint)`)
  );
}
