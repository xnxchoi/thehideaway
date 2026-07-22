import { sql } from "@payloadcms/db-postgres";
import type { Payload, PayloadRequest } from "payload";

import { hashCommerceCommandInput } from "./commerce-commands";
import { lockOrderInventoryReservationsInTransaction } from "./inventory-reservation-locks";
import { reservationHistory } from "./inventory-reservation-reconstruction";
import {
  compareReservationText,
  findReservationDocs,
  reservationPositiveQuantity,
  reservationReference,
  reservationRelationshipId,
  reservationTimestamp,
  reservationTransactionTimestamp,
  type ReservationStored,
  type ReservationTransactionRequest
} from "./inventory-reservation-store";
import { expireInventoryReservationInTransaction } from "./inventory-reservations";

export const DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE = 25;
export const MAX_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE = 100;

const ORDER_RESERVATION_READ_LIMIT = 1000;
const INVENTORY_RESERVATION_EXPIRY_FAIRNESS_WINDOW_SECONDS = 15 * 60;

const RECOVERABLE_ORDER_FAILURE_CODES = Object.freeze({
  "inventory-reservation-expiry-order-too-large":
    "inventory-reservation-expiry-order-limit-exceeded",
  "inventory-reservation-history-corrupt":
    "inventory-reservation-expiry-order-data-invalid"
} as const);

export type InventoryReservationExpiryBatchResult = Readonly<{
  ordersExamined: number;
  ordersExpired: number;
  ordersFailed: number;
  reservationsExpired: number;
}>;

function requireBatchSize(value: unknown): number {
  const batchSize =
    value === undefined
      ? DEFAULT_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE
      : value;
  if (
    typeof batchSize !== "number" ||
    !Number.isSafeInteger(batchSize) ||
    batchSize <= 0 ||
    batchSize > MAX_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE
  ) {
    throw new Error("invalid-inventory-reservation-expiry-batch-size");
  }
  return batchSize;
}

function candidateScanSize(batchSize: number): number {
  return Math.min(MAX_INVENTORY_RESERVATION_EXPIRY_BATCH_SIZE, batchSize * 2);
}

function recoverableOrderFailureCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) return undefined;
  return RECOVERABLE_ORDER_FAILURE_CODES[
    error.message as keyof typeof RECOVERABLE_ORDER_FAILURE_CODES
  ];
}

function transactionRequest(
  payload: Payload,
  baseReq: PayloadRequest | undefined,
  transactionID: string | number
): ReservationTransactionRequest {
  return {
    ...(baseReq ?? {}),
    payload,
    transactionID,
    context: { ...(baseReq?.context ?? {}) }
  } as ReservationTransactionRequest;
}

async function inTransaction<T>(input: {
  payload: Payload;
  req?: PayloadRequest;
  transactionError: string;
  run: (req: ReservationTransactionRequest) => Promise<T>;
}): Promise<T> {
  const transactionID = await input.payload.db.beginTransaction();
  if (
    (typeof transactionID !== "string" || transactionID.length === 0) &&
    (typeof transactionID !== "number" || !Number.isFinite(transactionID))
  ) {
    throw new Error(input.transactionError);
  }
  const req = transactionRequest(input.payload, input.req, transactionID);
  try {
    const result = await input.run(req);
    await input.payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    try {
      await input.payload.db.rollbackTransaction(transactionID);
    } catch (rollbackError) {
      throw new AggregateError(
        [error, rollbackError],
        "inventory-reservation-expiry-rollback-failed"
      );
    }
    throw error;
  }
}

async function candidateOrderIds(input: {
  payload: Payload;
  req?: PayloadRequest;
  scanSize: number;
}): Promise<readonly string[]> {
  return inTransaction({
    payload: input.payload,
    req: input.req,
    transactionError:
      "inventory-reservation-expiry-discovery-transaction-failed",
    run: async (req) => {
      const sessions = (
        input.payload.db as unknown as {
          sessions?: Record<
            string,
            { db: { execute: (query: unknown) => Promise<unknown> } }
          >;
        }
      ).sessions;
      const session = sessions?.[String(req.transactionID)];
      if (!session) {
        throw new Error(
          "inventory-reservation-expiry-discovery-transaction-missing"
        );
      }
      const result = (await session.db.execute(sql`
        WITH due_orders AS (
          SELECT order_id, MIN(expires_at) AS first_expires_at
          FROM inventory_reservations
          WHERE status = 'active'
          GROUP BY order_id
          HAVING MAX(expires_at) <= CURRENT_TIMESTAMP
        ), ranked_orders AS (
          SELECT
            order_id,
            ROW_NUMBER() OVER (
              ORDER BY first_expires_at, order_id
            ) - 1 AS candidate_ordinal,
            COUNT(*) OVER () AS order_count
          FROM due_orders
        ), rotated_orders AS (
          SELECT
            order_id,
            candidate_ordinal,
            order_count,
            MOD(
              FLOOR(
                EXTRACT(EPOCH FROM CURRENT_TIMESTAMP) /
                ${INVENTORY_RESERVATION_EXPIRY_FAIRNESS_WINDOW_SECONDS}
              )::bigint,
              order_count
            ) AS rotation_ordinal
          FROM ranked_orders
        )
        SELECT order_id
        FROM rotated_orders
        ORDER BY
          MOD(
            candidate_ordinal - rotation_ordinal + order_count,
            order_count
          ),
          candidate_ordinal
        LIMIT ${input.scanSize}
      `)) as { rows?: Array<{ order_id?: unknown }> };
      if (!result || !Array.isArray(result.rows)) {
        throw new Error("inventory-reservation-expiry-discovery-failed");
      }
      return Object.freeze(
        result.rows.map(({ order_id }) =>
          reservationReference(
            reservationRelationshipId(order_id),
            "inventory-reservation-history-corrupt"
          )
        )
      );
    }
  });
}

function expiryIdempotencyKey(reservationId: string): string {
  return hashCommerceCommandInput({
    source: "scheduled-inventory-reservation-expiry",
    version: 1,
    reservationId,
    operation: "expire"
  });
}

type PreparedReservationExpiry = Readonly<{
  reservation: ReservationStored;
  reservationId: string;
  expiresAt: string;
}>;

async function prepareActiveReservationExpiries(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
  reservations: readonly ReservationStored[];
}): Promise<PreparedReservationExpiry[]> {
  const prepared: PreparedReservationExpiry[] = [];
  for (const reservation of input.reservations) {
    const history = await reservationHistory(
      input.payload,
      input.req,
      reservation
    );
    if (history.status !== "active") continue;
    prepared.push({
      reservation,
      reservationId: reservationReference(
        reservation.id,
        "inventory-reservation-history-corrupt"
      ),
      expiresAt: reservationTimestamp(
        reservation.expires_at,
        "inventory-reservation-history-corrupt"
      )
    });
  }
  return prepared.sort((left, right) =>
    compareReservationText(left.reservationId, right.reservationId)
  );
}

async function expirePreparedReservations(input: {
  payload: Payload;
  req: ReservationTransactionRequest;
  orderId: string;
  prepared: readonly PreparedReservationExpiry[];
}): Promise<void> {
  for (const { reservation, reservationId, expiresAt } of input.prepared) {
    const skuId = reservationRelationshipId(reservation.sku);
    const locationId = reservationRelationshipId(reservation.location);
    if (!skuId || !locationId) {
      throw new Error("inventory-reservation-history-corrupt");
    }
    await expireInventoryReservationInTransaction({
      payload: input.payload,
      req: input.req,
      locksHeld: true,
      request: {
        idempotencyKey: expiryIdempotencyKey(reservationId),
        operation: "expire",
        orderId: input.orderId,
        skuId,
        locationId,
        reservationId,
        quantity: reservationPositiveQuantity(reservation.quantity),
        // The terminal service replaces this with CURRENT_TIMESTAMP. Keep the
        // validated request stable across job retries and replays.
        effectiveAt: expiresAt
      }
    });
  }
}

async function expireOrder(input: {
  payload: Payload;
  req?: PayloadRequest;
  orderId: string;
}): Promise<number> {
  return inTransaction({
    payload: input.payload,
    req: input.req,
    transactionError: "inventory-reservation-expiry-transaction-failed",
    run: async (req) => {
      await lockOrderInventoryReservationsInTransaction({
        payload: input.payload,
        req,
        orderId: input.orderId
      });

      // The lock helper discovers rows before taking their canonical locks.
      // Re-read after locking so a concurrent terminal operation cannot leave
      // this worker acting on its pre-lock snapshot.
      const reservations = await findReservationDocs(
        input.payload,
        req,
        "inventory-reservations",
        { order: { equals: input.orderId } },
        "id"
      );
      if (reservations.length >= ORDER_RESERVATION_READ_LIMIT) {
        throw new Error("inventory-reservation-expiry-order-too-large");
      }

      const transactionNow = await reservationTransactionTimestamp(
        input.payload,
        req
      );
      const prepared = await prepareActiveReservationExpiries({
        payload: input.payload,
        req,
        reservations
      });
      if (prepared.length === 0) return 0;

      // Orders are checkout aggregates. Expire all active siblings together,
      // or wait until the latest sibling reaches its exact database-time bound.
      if (
        prepared.some(
          ({ expiresAt }) => Date.parse(transactionNow) < Date.parse(expiresAt)
        )
      ) {
        return 0;
      }

      await expirePreparedReservations({
        payload: input.payload,
        req,
        orderId: input.orderId,
        prepared
      });
      return prepared.length;
    }
  });
}

export async function expireDueInventoryReservationOrders(input: {
  payload: Payload;
  req?: PayloadRequest;
  batchSize?: number;
}): Promise<InventoryReservationExpiryBatchResult> {
  const batchSize = requireBatchSize(input.batchSize);
  const orderIds = await candidateOrderIds({
    payload: input.payload,
    req: input.req,
    scanSize: candidateScanSize(batchSize)
  });
  let ordersExamined = 0;
  let ordersExpired = 0;
  let ordersFailed = 0;
  let reservationsExpired = 0;
  for (const orderId of orderIds) {
    if (ordersExpired >= batchSize) break;
    ordersExamined += 1;
    try {
      const expired = await expireOrder({
        payload: input.payload,
        req: input.req,
        orderId
      });
      if (expired > 0) ordersExpired += 1;
      reservationsExpired += expired;
    } catch (error) {
      const code = recoverableOrderFailureCode(error);
      if (!code) throw error;
      ordersFailed += 1;
      input.payload.logger.error({
        code,
        msg: "inventory-reservation-expiry-order-failed",
        orderId
      });
    }
  }
  return Object.freeze({
    ordersExamined,
    ordersExpired,
    ordersFailed,
    reservationsExpired
  });
}
