import { sql } from "@payloadcms/db-postgres";
import type { Payload, PayloadRequest } from "payload";

export type ReservationStored = Record<string, unknown>;
export type ReservationRequest = Partial<PayloadRequest> &
  Pick<PayloadRequest, "context" | "payload">;
export type ReservationTransactionRequest = ReservationRequest & {
  transactionID: string | number;
};

const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;

export function compareReservationText(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function isReservationRecord(
  value: unknown
): value is ReservationStored {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function reservationRelationshipId(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return String(value);
  }
  if (isReservationRecord(value)) return reservationRelationshipId(value.id);
  return undefined;
}

export function reservationReference(
  value: unknown,
  errorCode: string
): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

export function reservationTimestamp(
  value: unknown,
  errorCode: string
): string {
  if (typeof value !== "string") throw new Error(errorCode);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) throw new Error(errorCode);
  return new Date(parsed).toISOString();
}

export function reservationPositiveQuantity(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("inventory-reservation-history-corrupt");
  }
  return value;
}

export function requireReservationTransaction(
  req: ReservationRequest
): string | number {
  const value = req.transactionID;
  if (
    (typeof value !== "string" || value.length === 0) &&
    (typeof value !== "number" || !Number.isFinite(value))
  ) {
    throw new Error("inventory-reservation-transaction-required");
  }
  return value;
}

export function immutableReservationCopy<T>(value: T): T {
  if (Array.isArray(value)) {
    return Object.freeze(
      value.map((item) => immutableReservationCopy(item))
    ) as T;
  }
  if (!isReservationRecord(value)) return value;
  const copy = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      immutableReservationCopy(item)
    ])
  );
  return Object.freeze(copy) as T;
}

export async function findReservationDocs(
  payload: Payload,
  req: ReservationTransactionRequest,
  collection: string,
  where: ReservationStored,
  sort?: string
): Promise<ReservationStored[]> {
  const docs: ReservationStored[] = [];
  let page = 1;
  for (;;) {
    const result = (await payload.find({
      collection: collection,
      depth: 0,
      limit: 1000,
      page,
      pagination: true,
      overrideAccess: true,
      req,
      sort: sort ? [sort, "id"] : ["id"],
      where: where
    })) as unknown as {
      docs: ReservationStored[];
      hasNextPage?: boolean;
      nextPage?: number | null;
      totalPages?: number;
    };
    docs.push(...result.docs);
    if (result.hasNextPage !== true) return docs;
    if (
      !Number.isSafeInteger(result.nextPage) ||
      Number(result.nextPage) <= page
    ) {
      throw new Error("inventory-reservation-pagination-corrupt");
    }
    page = Number(result.nextPage);
  }
}

export async function findReservationDocById(
  payload: Payload,
  req: ReservationTransactionRequest,
  collection: string,
  id: string
): Promise<ReservationStored> {
  const doc = (await payload.findByID({
    collection: collection,
    id,
    depth: 0,
    overrideAccess: true,
    req
  })) as unknown as ReservationStored | null;
  if (!doc) throw new Error(`inventory-reservation-${collection}-not-found`);
  return doc;
}

export async function findReservationEntry(
  payload: Payload,
  req: ReservationTransactionRequest,
  idempotencyKey: string
): Promise<ReservationStored | undefined> {
  const docs = await findReservationDocs(
    payload,
    req,
    "inventory-reservation-entries",
    { idempotency_key: { equals: idempotencyKey } }
  );
  return docs[0];
}

export async function reservationTransactionTimestamp(
  payload: Payload,
  req: ReservationTransactionRequest
): Promise<string> {
  const sessions = (
    payload.db as unknown as {
      sessions?: Record<
        string,
        { db: { execute: (query: unknown) => Promise<unknown> } }
      >;
    }
  )?.sessions;
  const session = sessions?.[String(req.transactionID)];
  if (!session)
    throw new Error("inventory-reservation-transaction-time-missing");
  const result = (await session.db.execute(
    sql`SELECT CURRENT_TIMESTAMP AS transaction_now`
  )) as { rows?: Array<{ transaction_now: Date | string }> };
  const value = result.rows?.[0]?.transaction_now;
  if (!value) throw new Error("inventory-reservation-transaction-time-missing");
  return new Date(value).toISOString();
}
