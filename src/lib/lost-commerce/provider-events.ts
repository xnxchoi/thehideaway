import type { Payload, PayloadRequest } from "payload";
import { createHash, randomUUID } from "node:crypto";
import type { CommerceProviderEvent } from "@/payload-types";
import { paymentWebhookLock } from "@/lib/db/sequences";

type ProviderEventInput = {
  paymentId?: string;
  event: Record<string, unknown>;
  rawBody?: string;
};

export type CommerceProviderEventWriteResult = {
  recorded: boolean;
  duplicate: boolean;
  conflict: boolean;
  eventId: string | null;
};

const PROVIDER_EVENT_LEASE_MS = 5 * 60 * 1000;

export function hashCommerceProviderPayload(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export type CommerceProviderEventRecord = Pick<
  CommerceProviderEvent,
  "dedupe_key" | "provider" | "event_key"
> &
  Partial<
    Pick<
      CommerceProviderEvent,
      | "event_type"
      | "payment_ref"
      | "provider_status"
      | "transaction_ref"
      | "occurred_at"
    >
  >;

function nonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isoDate(value: unknown): string | undefined {
  const text = nonEmptyString(value);
  if (!text) return undefined;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

export function sanitizeCommerceProviderEvent(
  input: ProviderEventInput
): CommerceProviderEventRecord | null {
  const nested =
    input.event.data && typeof input.event.data === "object"
      ? (input.event.data as Record<string, unknown>)
      : {};
  const eventId = nonEmptyString(
    input.event.provider_event_id ??
      input.event.webhook_id ??
      input.event.event_id
  );
  if (!eventId) return null;

  const eventType = nonEmptyString(input.event.type);
  const paymentRef = nonEmptyString(input.paymentId);
  const providerStatus = nonEmptyString(
    nested.status ?? input.event.status ?? input.event.payment_status
  );
  const transactionRef = nonEmptyString(
    nested.transactionId ??
      input.event.transaction_id ??
      input.event.payment_txn_ref
  );
  const occurredAt = isoDate(
    nested.occurredAt ?? input.event.occurred_at ?? input.event.timestamp
  );

  return {
    dedupe_key: `portone:${eventId}`,
    provider: "portone",
    event_key: eventId,
    ...(eventType ? { event_type: eventType } : {}),
    ...(paymentRef ? { payment_ref: paymentRef } : {}),
    ...(providerStatus ? { provider_status: providerStatus } : {}),
    ...(transactionRef ? { transaction_ref: transactionRef } : {}),
    ...(occurredAt ? { occurred_at: occurredAt } : {})
  };
}

export async function recordCommerceProviderEvent(input: {
  payload: Payload;
  req: PayloadRequest;
  paymentId?: string;
  productPaymentId?: string;
  event: Record<string, unknown>;
  rawBody?: string;
}): Promise<CommerceProviderEventWriteResult> {
  const record = sanitizeCommerceProviderEvent(input);
  if (!record) {
    return {
      recorded: false,
      duplicate: false,
      conflict: false,
      eventId: null
    };
  }
  const payloadHash = hashCommerceProviderPayload(
    input.rawBody ?? JSON.stringify(input.event)
  );

  const existing = await input.payload.find({
    collection: "commerce-provider-events",
    overrideAccess: true,
    req: input.req,
    depth: 0,
    limit: 1,
    where: { dedupe_key: { equals: record.dedupe_key } }
  });
  if (existing.docs.length > 0) {
    const existingEvent = existing.docs[0];
    const conflict = Boolean(
      existingEvent.payload_hash && existingEvent.payload_hash !== payloadHash
    );
    return {
      recorded: false,
      duplicate: !conflict,
      conflict,
      eventId: String(existingEvent.id)
    };
  }

  const created = await input.payload.create({
    collection: "commerce-provider-events",
    overrideAccess: true,
    req: input.req,
    data: {
      ...record,
      payload_hash: payloadHash,
      processing_status: "received",
      attempt_count: 0,
      ...(input.productPaymentId
        ? { product_payment: input.productPaymentId }
        : {})
    }
  });
  return {
    recorded: true,
    duplicate: false,
    conflict: false,
    eventId: String(created.id)
  };
}

export async function recordCommerceProviderEventStandalone(input: {
  payload: Payload;
  paymentId?: string;
  event: Record<string, unknown>;
  rawBody?: string;
}): Promise<CommerceProviderEventWriteResult> {
  const record = sanitizeCommerceProviderEvent(input);
  if (!record) {
    return {
      recorded: false,
      duplicate: false,
      conflict: false,
      eventId: null
    };
  }

  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("provider-event-transaction-failed");
  const req = {
    payload: input.payload,
    transactionID,
    context: {}
  } as PayloadRequest;

  try {
    await paymentWebhookLock(
      input.payload,
      transactionID,
      `provider-event:${record.dedupe_key}`
    );
    const result = await recordCommerceProviderEvent({
      ...input,
      req
    });
    await input.payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    input.payload.logger?.error?.(
      `[provider-event] persistence failed for ${record.dedupe_key}: ${(error as Error).message}`
    );
    throw error;
  }
}

function activeLease(row: CommerceProviderEvent, now: Date): boolean {
  if (row.processing_status !== "processing" || !row.lease_expires_at) {
    return false;
  }
  return new Date(row.lease_expires_at).getTime() > now.getTime();
}

export async function claimCommerceProviderEvent(input: {
  payload: Payload;
  eventId: string;
  allowRejectedReplay?: boolean;
  now?: Date;
  leaseMs?: number;
}): Promise<
  | { kind: "claimed"; leaseToken: string }
  | { kind: "busy" }
  | {
      kind: "terminal";
      status: "processed" | "rejected";
      outcomeCode?: string;
    }
> {
  const now = input.now ?? new Date();
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("provider-event-transaction-failed");
  const req = {
    payload: input.payload,
    transactionID,
    context: {}
  } as PayloadRequest;

  try {
    await paymentWebhookLock(
      input.payload,
      transactionID,
      `provider-event-processing:${input.eventId}`
    );
    const row = await input.payload.findByID({
      collection: "commerce-provider-events",
      id: input.eventId,
      overrideAccess: true,
      req,
      depth: 0
    });
    if (
      row.processing_status === "processed" ||
      (row.processing_status === "rejected" && !input.allowRejectedReplay)
    ) {
      await input.payload.db.commitTransaction(transactionID);
      return {
        kind: "terminal",
        status: row.processing_status,
        ...(row.outcome_code ? { outcomeCode: row.outcome_code } : {})
      };
    }
    if (activeLease(row, now)) {
      await input.payload.db.commitTransaction(transactionID);
      return { kind: "busy" };
    }

    const leaseToken = randomUUID();
    await input.payload.update({
      collection: "commerce-provider-events",
      id: input.eventId,
      overrideAccess: true,
      req,
      data: {
        processing_status: "processing",
        attempt_count: Number(row.attempt_count ?? 0) + 1,
        lease_token_hash: hashCommerceProviderPayload(leaseToken),
        lease_expires_at: new Date(
          now.getTime() + (input.leaseMs ?? PROVIDER_EVENT_LEASE_MS)
        ).toISOString(),
        last_attempt_at: now.toISOString(),
        outcome_code: null,
        last_error_code: null,
        processed_at: null
      }
    });
    await input.payload.db.commitTransaction(transactionID);
    return { kind: "claimed", leaseToken };
  } catch (error) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw error;
  }
}

export async function completeCommerceProviderEvent(input: {
  payload: Payload;
  eventId: string;
  leaseToken: string;
  status: "processed" | "rejected" | "retryable";
  outcomeCode: string;
  now?: Date;
}): Promise<void> {
  const now = input.now ?? new Date();
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("provider-event-transaction-failed");
  const req = {
    payload: input.payload,
    transactionID,
    context: {}
  } as PayloadRequest;

  try {
    await paymentWebhookLock(
      input.payload,
      transactionID,
      `provider-event-processing:${input.eventId}`
    );
    const row = await input.payload.findByID({
      collection: "commerce-provider-events",
      id: input.eventId,
      overrideAccess: true,
      req,
      depth: 0
    });
    if (
      row.processing_status !== "processing" ||
      row.lease_token_hash !== hashCommerceProviderPayload(input.leaseToken)
    ) {
      throw new Error("provider-event-lease-lost");
    }

    await input.payload.update({
      collection: "commerce-provider-events",
      id: input.eventId,
      overrideAccess: true,
      req,
      data: {
        processing_status: input.status,
        outcome_code: input.status === "retryable" ? null : input.outcomeCode,
        last_error_code:
          input.status === "retryable" ? input.outcomeCode : null,
        processed_at: input.status === "retryable" ? null : now.toISOString(),
        lease_token_hash: null,
        lease_expires_at: null
      }
    });
    await input.payload.db.commitTransaction(transactionID);
  } catch (error) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw error;
  }
}
