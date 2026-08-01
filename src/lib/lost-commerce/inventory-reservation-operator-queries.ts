import { NotFound, type Payload, type PayloadRequest } from "payload";

import { hashCommerceCommandInput } from "./commerce-commands";
import {
  classifyInventoryReservationQueue,
  hashInventoryReservationQueueVersion,
  type InventoryReservationOperatorQueue
} from "./inventory-reservation-queues";
import { selectAuthoritativeInventoryReservationPayment } from "./inventory-reservation-operator-payment";

type Stored = Record<string, unknown>;
const COMPLETE_SCAN_LIMIT = 5000;

export type InventoryReservationOperatorQueueItem = Readonly<{
  orderId: string;
  orderStatus: string;
  paymentId: string | null;
  paymentStatus: string | null;
  queue: InventoryReservationOperatorQueue;
  stateHash: string;
  expiresAt: string | null;
  reservationIds: readonly string[];
  permittedActions: readonly ("release" | "expire" | "reconcile")[];
  links: Readonly<{
    order: string;
    payment: string | null;
    reservations: string;
    entries: string;
  }>;
  evidence: Readonly<{
    entryIds: readonly string[];
    inventoryLevelIds: readonly string[];
  }>;
}>;

export type InventoryReservationOperatorQueueResult = Readonly<{
  queue: InventoryReservationOperatorQueue;
  generatedAt: string;
  stateHash: string;
  items: readonly InventoryReservationOperatorQueueItem[];
}>;

export type InventoryReservationOperatorOrderState = Readonly<{
  order: Readonly<{
    id: string;
    orderRef: string;
    status: string;
    paymentStatus: string;
    updatedAt: string;
    doc: Stored;
  }>;
  payment: Readonly<{
    id: string;
    status: string;
    paidAt: string | null;
    updatedAt: string;
    paymentRef: string | null;
    provider: string | null;
    transactionReference: string | null;
    doc: Stored;
  }> | null;
  reservations: readonly Readonly<{
    id: string;
    status: string;
    expiresAt: string;
    updatedAt: string;
    terminalAt: string | null;
    skuId: string;
    locationId: string;
    quantity: number | null;
    safetyStock: number | null;
    recoveryOf: string | null;
    doc: Stored;
  }>[];
  inventoryLevels: readonly Readonly<{
    aggregateKey: string;
    id: string | null;
    quantity: number | null;
    movementCount: number | null;
    updatedAt: string | null;
  }>[];
  stateHash: string;
}>;

function id(value: unknown): string | undefined {
  if (typeof value === "string" && value.length > 0) return value;
  if (value && typeof value === "object" && "id" in value) {
    const nested = (value as { id?: unknown }).id;
    if (typeof nested === "string" && nested.length > 0) return nested;
  }
  return undefined;
}

function text(value: unknown, code: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(code);
  return value;
}

function date(value: unknown, code: string): string {
  const valueText = text(value, code);
  if (!Number.isFinite(Date.parse(valueText))) throw new Error(code);
  return valueText;
}

function optionalText(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function optionalInteger(value: unknown, code: string): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error(code);
  }
  return value;
}

function boundedLimit(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 100
  ) {
    throw new Error("invalid-inventory-reservation-operator-queue-limit");
  }
  return value;
}

async function findDocs(input: {
  payload: Payload;
  req?: PayloadRequest;
  collection: string;
  where: Stored;
  limit: number;
  sort?: string;
}): Promise<Stored[]> {
  const result = await input.payload.find({
    collection: input.collection as never,
    depth: 0,
    overrideAccess: true,
    ...(input.req ? { req: input.req } : {}),
    where: input.where as never,
    limit: input.limit,
    ...(input.sort ? { sort: input.sort } : {})
  });
  return (result.docs ?? []) as unknown as Stored[];
}

async function findCompleteDocs(input: {
  payload: Payload;
  req?: PayloadRequest;
  collection: string;
  where: Stored;
  sort?: string;
}): Promise<Stored[]> {
  const result = await input.payload.find({
    collection: input.collection as never,
    depth: 0,
    overrideAccess: true,
    ...(input.req ? { req: input.req } : {}),
    where: input.where as never,
    limit: COMPLETE_SCAN_LIMIT,
    ...(input.sort ? { sort: input.sort } : {})
  });
  const docs = (result.docs ?? []) as unknown as Stored[];
  if (
    result.hasNextPage ||
    (typeof result.totalDocs === "number" && result.totalDocs > docs.length)
  ) {
    throw new Error("inventory-reservation-operator-scan-limit");
  }
  return docs;
}

function ids(values: readonly Stored[]): string[] {
  return values
    .map((value) => id(value.id))
    .filter((value): value is string => Boolean(value));
}

function normalizeReservation(reservation: Stored) {
  return {
    id: text(id(reservation.id), "inventory-reservation-history-corrupt"),
    status: text(reservation.status, "inventory-reservation-history-corrupt"),
    expiresAt: date(
      reservation.expires_at,
      "inventory-reservation-history-corrupt"
    ),
    updatedAt: date(
      reservation.updatedAt,
      "inventory-reservation-history-corrupt"
    ),
    terminalAt:
      reservation.terminal_at === null || reservation.terminal_at === undefined
        ? null
        : date(
            reservation.terminal_at,
            "inventory-reservation-history-corrupt"
          ),
    skuId: text(id(reservation.sku), "inventory-reservation-history-corrupt"),
    locationId: text(
      id(reservation.location),
      "inventory-reservation-history-corrupt"
    ),
    quantity: optionalInteger(
      reservation.quantity,
      "inventory-reservation-history-corrupt"
    ),
    safetyStock: optionalInteger(
      reservation.safety_stock,
      "inventory-reservation-history-corrupt"
    ),
    recoveryOf: id(reservation.recovery_of) ?? null,
    doc: reservation
  };
}

function normalizePayment(payment: Stored | undefined) {
  if (!payment) return null;
  return {
    id: text(id(payment.id), "inventory-payment-history-corrupt"),
    status: text(payment.status, "inventory-payment-history-corrupt"),
    paidAt:
      payment.paid_at === null || payment.paid_at === undefined
        ? null
        : date(payment.paid_at, "inventory-payment-history-corrupt"),
    updatedAt: date(payment.updatedAt, "inventory-payment-history-corrupt"),
    paymentRef: optionalText(payment.payment_ref),
    provider: optionalText(payment.provider),
    transactionReference: optionalText(payment.portone_transaction_ref),
    doc: payment
  };
}

async function loadInventoryLevelVersions(input: {
  payload: Payload;
  req?: PayloadRequest;
  reservations: readonly ReturnType<typeof normalizeReservation>[];
}) {
  const aggregateKeys = [
    ...new Set(
      input.reservations.map(
        ({ skuId, locationId }) => `${skuId}:${locationId}:available`
      )
    )
  ].sort();
  const levels = aggregateKeys.length
    ? await findDocs({
        payload: input.payload,
        req: input.req,
        collection: "inventory-levels",
        where: { aggregate_key: { in: aggregateKeys } },
        limit: aggregateKeys.length
      })
    : [];
  const levelByKey = new Map(
    levels.flatMap((level) =>
      typeof level.aggregate_key === "string"
        ? [[level.aggregate_key, level] as const]
        : []
    )
  );
  return aggregateKeys.map((aggregateKey) => {
    const level = levelByKey.get(aggregateKey);
    return {
      aggregateKey,
      id: level ? (id(level.id) ?? null) : null,
      quantity: level
        ? optionalInteger(level.quantity, "inventory-level-history-corrupt")
        : null,
      movementCount: level
        ? optionalInteger(
            level.movement_count,
            "inventory-level-history-corrupt"
          )
        : null,
      updatedAt:
        level?.updatedAt === null || level?.updatedAt === undefined
          ? null
          : date(level.updatedAt, "inventory-level-history-corrupt")
    };
  });
}

function byRelationship(
  values: readonly Stored[],
  field: string
): Map<string, Stored[]> {
  const grouped = new Map<string, Stored[]>();
  for (const value of values) {
    const relationshipId = id(value[field]);
    if (!relationshipId) continue;
    grouped.set(relationshipId, [
      ...(grouped.get(relationshipId) ?? []),
      value
    ]);
  }
  return grouped;
}

function permittedActions(input: {
  queue: InventoryReservationOperatorQueue;
  orderStatus: string;
  orderPaymentStatus: string;
  paymentStatus?: string;
}): readonly ("release" | "expire" | "reconcile")[] {
  if (input.queue === "stuck") return Object.freeze(["expire"]);
  if (input.queue === "paid_inventory_review") {
    return Object.freeze(["reconcile"]);
  }
  if (
    ["failed", "canceled"].includes(input.orderStatus) &&
    ["unpaid", "failed"].includes(input.orderPaymentStatus) &&
    input.paymentStatus !== "paid"
  ) {
    return Object.freeze(["release"]);
  }
  return Object.freeze([]);
}

function adminLink(collection: string, resourceId?: string): string | null {
  if (!resourceId) return null;
  return `/vault/collections/${collection}/${encodeURIComponent(resourceId)}`;
}

export async function loadInventoryReservationOperatorOrderState(input: {
  payload: Payload;
  req: PayloadRequest;
  orderId: string;
}): Promise<InventoryReservationOperatorOrderState> {
  let order: Stored | null;
  try {
    order = (await input.payload.findByID({
      collection: "product-orders",
      id: input.orderId,
      depth: 0,
      overrideAccess: true,
      req: input.req
    })) as unknown as Stored | null;
  } catch (error) {
    if (error instanceof NotFound) {
      throw new Error("inventory-reservation-operator-order-not-found");
    }
    throw error;
  }
  if (!order) throw new Error("inventory-reservation-operator-order-not-found");
  const reservations = await findCompleteDocs({
    payload: input.payload,
    req: input.req,
    collection: "inventory-reservations",
    where: { order: { equals: input.orderId } },
    sort: "id"
  });
  if (reservations.length === 0) {
    throw new Error("inventory-reservation-operator-order-empty");
  }
  const payments = await findCompleteDocs({
    payload: input.payload,
    req: input.req,
    collection: "product-payments",
    where: { order: { equals: input.orderId } },
    sort: "-updatedAt"
  });
  const normalizedReservations = reservations.map(normalizeReservation);
  const normalizedOrder = {
    id: text(id(order.id), "inventory-order-history-corrupt"),
    orderRef: text(order.order_ref, "inventory-order-history-corrupt"),
    status: text(order.status, "inventory-order-history-corrupt"),
    paymentStatus: text(
      order.payment_status,
      "inventory-order-history-corrupt"
    ),
    updatedAt: date(order.updatedAt, "inventory-order-history-corrupt"),
    doc: order
  };
  const normalizedPayment = normalizePayment(
    selectAuthoritativeInventoryReservationPayment(
      payments,
      normalizedOrder.orderRef
    )
  );
  const inventoryLevels = await loadInventoryLevelVersions({
    payload: input.payload,
    req: input.req,
    reservations: normalizedReservations
  });
  const stateHash = hashInventoryReservationQueueVersion({
    order: normalizedOrder,
    payment: normalizedPayment,
    reservations: normalizedReservations,
    inventoryLevels
  });
  return Object.freeze({
    order: Object.freeze(normalizedOrder),
    payment: normalizedPayment ? Object.freeze(normalizedPayment) : null,
    reservations: Object.freeze(
      normalizedReservations.map((reservation) => Object.freeze(reservation))
    ),
    inventoryLevels: Object.freeze(
      inventoryLevels.map((level) => Object.freeze(level))
    ),
    stateHash
  });
}

type QueueOptions = Readonly<{
  now: Date;
  expiringBefore: string;
  limit: number;
}>;

function queueOptions(input: {
  now?: Date;
  expiringHorizonMinutes?: number;
  limit?: number;
}): QueueOptions {
  const now = new Date((input.now ?? new Date()).getTime());
  if (Number.isNaN(now.getTime())) {
    throw new Error("invalid-inventory-reservation-operator-queue-time");
  }
  const horizon = input.expiringHorizonMinutes ?? 15;
  if (!Number.isSafeInteger(horizon) || horizon < 1 || horizon > 24 * 60) {
    throw new Error("invalid-inventory-reservation-operator-queue-horizon");
  }
  return {
    now,
    expiringBefore: new Date(now.getTime() + horizon * 60_000).toISOString(),
    limit: boundedLimit(input.limit ?? 25)
  };
}

async function loadQueueRoots(input: {
  payload: Payload;
  req?: PayloadRequest;
  queue: InventoryReservationOperatorQueue;
  limit: number;
}): Promise<{ orders: Stored[]; reservations: Stored[] }> {
  if (input.queue === "paid_inventory_review") {
    const orders = await findDocs({
      ...input,
      collection: "product-orders",
      where: { status: { equals: "paid_inventory_review" } },
      sort: "updatedAt"
    });
    const orderIds = ids(orders);
    const reservations = orderIds.length
      ? await findCompleteDocs({
          ...input,
          collection: "inventory-reservations",
          where: { order: { in: orderIds } },
          sort: "expires_at"
        })
      : [];
    return { orders, reservations };
  }
  const reservations = await findCompleteDocs({
    ...input,
    collection: "inventory-reservations",
    where: { status: { equals: "active" } },
    sort: "expires_at"
  });
  const orderIds = [
    ...new Set(reservations.map((value) => id(value.order)).filter(Boolean))
  ];
  const orders = orderIds.length
    ? await findCompleteDocs({
        ...input,
        collection: "product-orders",
        where: { id: { in: orderIds } }
      })
    : [];
  return { orders, reservations };
}

async function loadQueueRelations(input: {
  payload: Payload;
  req?: PayloadRequest;
  orders: readonly Stored[];
  reservations: readonly Stored[];
}) {
  const orderIds = ids(input.orders);
  const reservationIds = ids(input.reservations);
  const payments = orderIds.length
    ? await findCompleteDocs({
        ...input,
        collection: "product-payments",
        where: { order: { in: orderIds } }
      })
    : [];
  const entries = reservationIds.length
    ? await findCompleteDocs({
        ...input,
        collection: "inventory-reservation-entries",
        where: { reservation: { in: reservationIds } },
        sort: "effective_at"
      })
    : [];
  const aggregateKeys = [
    ...new Set(
      input.reservations.flatMap((reservation) => {
        const skuId = id(reservation.sku);
        const locationId = id(reservation.location);
        return skuId && locationId ? [`${skuId}:${locationId}:available`] : [];
      })
    )
  ];
  const levels = aggregateKeys.length
    ? await findDocs({
        ...input,
        collection: "inventory-levels",
        where: { aggregate_key: { in: aggregateKeys } },
        limit: aggregateKeys.length
      })
    : [];
  return { payments, entries, levels };
}

function queueInventoryLevels(
  reservations: readonly ReturnType<typeof normalizeReservation>[],
  levelByKey: ReadonlyMap<string, Stored>
) {
  return [
    ...new Set(
      reservations.map(
        ({ skuId, locationId }) => `${skuId}:${locationId}:available`
      )
    )
  ]
    .sort()
    .map((aggregateKey) => {
      const level = levelByKey.get(aggregateKey);
      return {
        aggregateKey,
        id: level ? (id(level.id) ?? null) : null,
        quantity: level
          ? optionalInteger(level.quantity, "inventory-level-history-corrupt")
          : null,
        movementCount: level
          ? optionalInteger(
              level.movement_count,
              "inventory-level-history-corrupt"
            )
          : null,
        updatedAt:
          level?.updatedAt === null || level?.updatedAt === undefined
            ? null
            : date(level.updatedAt, "inventory-level-history-corrupt")
      };
    });
}

function queueItemEvidence(input: {
  reservationIds: readonly string[];
  entriesByReservation: ReadonlyMap<string, Stored[]>;
  inventoryLevels: readonly { id: string | null }[];
}) {
  const entryIds = input.reservationIds
    .flatMap(
      (reservationId) => input.entriesByReservation.get(reservationId) ?? []
    )
    .flatMap((entry) => {
      const entryId = id(entry.id);
      return entryId ? [entryId] : [];
    })
    .sort();
  return Object.freeze({
    entryIds: Object.freeze(entryIds),
    inventoryLevelIds: Object.freeze(
      input.inventoryLevels.flatMap(({ id }) => (id ? [id] : [])).sort()
    )
  });
}

function queueItemLinks(input: {
  orderId: string;
  paymentId: string | null;
  reservationIds: readonly string[];
}) {
  return Object.freeze({
    order: adminLink("product-orders", input.orderId)!,
    payment: adminLink("product-payments", input.paymentId ?? undefined),
    reservations: `/vault/collections/inventory-reservations?where[order][equals]=${encodeURIComponent(input.orderId)}`,
    entries: `/vault/collections/inventory-reservation-entries?where[reservation][in]=${encodeURIComponent(input.reservationIds.join(","))}`
  });
}

function normalizeQueueCandidate(input: {
  order: Stored;
  queue: InventoryReservationOperatorQueue;
  options: QueueOptions;
  reservations: readonly Stored[];
  payments: readonly Stored[];
}) {
  const orderId = id(input.order.id);
  if (!orderId) return null;
  const normalizedReservations = input.reservations.map(normalizeReservation);
  const normalizedPayment = normalizePayment(
    selectAuthoritativeInventoryReservationPayment(
      input.payments,
      optionalText(input.order.order_ref) ?? undefined
    )
  );
  const orderStatus = text(
    input.order.status,
    "inventory-order-history-corrupt"
  );
  const queue = classifyInventoryReservationQueue({
    orderStatus,
    reservations: normalizedReservations,
    now: input.options.now.toISOString(),
    expiringBefore: input.options.expiringBefore
  });
  if (queue !== input.queue) return null;
  const orderPaymentStatus = text(
    input.order.payment_status,
    "inventory-order-history-corrupt"
  );
  return {
    orderId,
    orderStatus,
    orderPaymentStatus,
    queue,
    normalizedReservations,
    normalizedPayment,
    updatedAt: date(input.order.updatedAt, "inventory-order-history-corrupt")
  };
}

function versionQueueCandidate(
  candidate: NonNullable<ReturnType<typeof normalizeQueueCandidate>>,
  levelByKey: ReadonlyMap<string, Stored>
) {
  const inventoryLevels = queueInventoryLevels(
    candidate.normalizedReservations,
    levelByKey
  );
  const reservationIds = candidate.normalizedReservations
    .map(({ id }) => id)
    .sort();
  const stateHash = hashInventoryReservationQueueVersion({
    order: {
      id: candidate.orderId,
      status: candidate.orderStatus,
      paymentStatus: candidate.orderPaymentStatus,
      updatedAt: candidate.updatedAt
    },
    payment: candidate.normalizedPayment,
    reservations: candidate.normalizedReservations,
    inventoryLevels
  });
  return { inventoryLevels, reservationIds, stateHash };
}

function assembleQueueItem(input: {
  candidate: NonNullable<ReturnType<typeof normalizeQueueCandidate>>;
  version: ReturnType<typeof versionQueueCandidate>;
  entriesByReservation: ReadonlyMap<string, Stored[]>;
}): InventoryReservationOperatorQueueItem {
  const paymentId = input.candidate.normalizedPayment?.id ?? null;
  const paymentStatus = input.candidate.normalizedPayment?.status ?? null;
  return Object.freeze({
    orderId: input.candidate.orderId,
    orderStatus: input.candidate.orderStatus,
    paymentId,
    paymentStatus,
    queue: input.candidate.queue,
    stateHash: input.version.stateHash,
    expiresAt:
      input.candidate.normalizedReservations
        .map(({ expiresAt }) => expiresAt)
        .sort()
        .at(-1) ?? null,
    reservationIds: Object.freeze(input.version.reservationIds),
    permittedActions: permittedActions({
      queue: input.candidate.queue,
      orderStatus: input.candidate.orderStatus,
      orderPaymentStatus: input.candidate.orderPaymentStatus,
      ...(paymentStatus ? { paymentStatus } : {})
    }),
    links: queueItemLinks({
      orderId: input.candidate.orderId,
      paymentId,
      reservationIds: input.version.reservationIds
    }),
    evidence: queueItemEvidence({
      reservationIds: input.version.reservationIds,
      entriesByReservation: input.entriesByReservation,
      inventoryLevels: input.version.inventoryLevels
    })
  });
}

function buildQueueItem(input: {
  order: Stored;
  queue: InventoryReservationOperatorQueue;
  options: QueueOptions;
  reservations: readonly Stored[];
  payments: readonly Stored[];
  entriesByReservation: ReadonlyMap<string, Stored[]>;
  levelByKey: ReadonlyMap<string, Stored>;
}): InventoryReservationOperatorQueueItem | null {
  const candidate = normalizeQueueCandidate(input);
  if (!candidate) return null;
  return assembleQueueItem({
    candidate,
    version: versionQueueCandidate(candidate, input.levelByKey),
    entriesByReservation: input.entriesByReservation
  });
}

export async function listInventoryReservationOperatorQueue(input: {
  payload: Payload;
  req?: PayloadRequest;
  queue: InventoryReservationOperatorQueue;
  now?: Date;
  expiringHorizonMinutes?: number;
  limit?: number;
}): Promise<InventoryReservationOperatorQueueResult> {
  const options = queueOptions(input);
  const roots = await loadQueueRoots({ ...input, limit: options.limit });
  const relations = await loadQueueRelations({ ...input, ...roots });
  const reservationsByOrder = byRelationship(roots.reservations, "order");
  const paymentsByOrder = byRelationship(relations.payments, "order");
  const entriesByReservation = byRelationship(relations.entries, "reservation");
  const levelByKey = new Map(
    relations.levels.flatMap((level) =>
      typeof level.aggregate_key === "string"
        ? [[level.aggregate_key, level] as const]
        : []
    )
  );
  const items = roots.orders.flatMap((order) => {
    const orderId = id(order.id);
    const item = buildQueueItem({
      order,
      queue: input.queue,
      options,
      reservations: orderId ? (reservationsByOrder.get(orderId) ?? []) : [],
      payments: orderId ? (paymentsByOrder.get(orderId) ?? []) : [],
      entriesByReservation,
      levelByKey
    });
    return item ? [item] : [];
  });
  const ordered = items
    .sort(
      (left, right) =>
        (left.expiresAt ?? "").localeCompare(right.expiresAt ?? "") ||
        left.orderId.localeCompare(right.orderId)
    )
    .slice(0, options.limit);
  return Object.freeze({
    queue: input.queue,
    generatedAt: options.now.toISOString(),
    stateHash: hashCommerceCommandInput(
      ordered.map(({ orderId, stateHash }) => ({ orderId, stateHash }))
    ),
    items: Object.freeze(ordered)
  });
}
