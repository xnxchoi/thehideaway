import { createHash, randomUUID } from "node:crypto";
import type { Payload, PayloadRequest } from "payload";
import type { CommerceCommand } from "@/payload-types";

import { commerceCommandLock } from "@/lib/db/sequences";

const COMMAND_KEY_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;
const REQUEST_HASH_PATTERN = /^[a-f0-9]{64}$/;
const REFERENCE_PATTERN = /^[A-Za-z0-9_.:~/-]{1,200}$/;
const DEFAULT_LEASE_MS = 30_000;
const MAX_LEASE_MS = 5 * 60_000;
const MAX_RESPONSE_BYTES = 32 * 1024;

const SENSITIVE_RESPONSE_KEYS = new Set([
  "accountnumber",
  "address",
  "addressline1",
  "addressline2",
  "billingaddress",
  "cardnumber",
  "customeremail",
  "customername",
  "email",
  "password",
  "phone",
  "phonenumber",
  "postalcode",
  "rawrequest",
  "recipientname",
  "requestpayload",
  "shippingaddress",
  "zipcode"
]);

type JsonPrimitive = string | number | boolean | null;
export type CommerceCommandSafeResponse =
  | JsonPrimitive
  | readonly CommerceCommandSafeResponse[]
  | { readonly [key: string]: CommerceCommandSafeResponse };

type CommerceCommandRecord = CommerceCommand;

type ClaimBaseInput = {
  payload: Payload;
  commandKey: unknown;
  validatedInput: unknown;
  businessKey?: string;
  createBusinessKey?: () => string;
  now?: Date;
  leaseMs?: number;
};

export type CommerceCommandClaim =
  | {
      kind: "claimed";
      businessKey: string;
      requestHash: string;
      leaseToken: string;
      leaseExpiresAt: string;
    }
  | {
      kind: "in_progress";
      businessKey: string;
      retryAfterMs: number;
    }
  | { kind: "conflict" }
  | {
      kind: "replay";
      businessKey: string;
      response: CommerceCommandSafeResponse;
    };

type CompleteCommerceCommandInput = {
  payload: Payload;
  req: PayloadRequest;
  commandKey: unknown;
  requestHash: string;
  leaseToken: string;
  response: CommerceCommandSafeResponse;
  resource: { type: string; id: string };
  now?: Date;
};

function canonicalizeJson(value: unknown, seen: Set<object>): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new Error("invalid-commerce-command-input");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    throw new Error("invalid-commerce-command-input");
  }
  if (seen.has(value)) throw new Error("invalid-commerce-command-input");

  const prototype = Object.getPrototypeOf(value);
  if (
    !Array.isArray(value) &&
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    throw new Error("invalid-commerce-command-input");
  }

  seen.add(value);
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).some((key) => !/^(0|[1-9][0-9]*)$/.test(key))) {
        throw new Error("invalid-commerce-command-input");
      }
      for (let index = 0; index < value.length; index += 1) {
        if (!(index in value))
          throw new Error("invalid-commerce-command-input");
      }
      return `[${value.map((item) => canonicalizeJson(item, seen)).join(",")}]`;
    }

    const objectValue = value as Record<string, unknown>;
    const entries = Object.keys(objectValue)
      .sort()
      .map(
        (key) =>
          `${JSON.stringify(key)}:${canonicalizeJson(objectValue[key], seen)}`
      );
    return `{${entries.join(",")}}`;
  } finally {
    seen.delete(value);
  }
}

function canonicalJson(value: unknown): string {
  return canonicalizeJson(value, new Set());
}

/** Hash only caller-validated JSON. The canonical encoding is key-order stable. */
export function hashCommerceCommandInput(validatedInput: unknown): string {
  return createHash("sha256")
    .update(canonicalJson(validatedInput), "utf8")
    .digest("hex");
}

export function validateCommerceCommandKey(commandKey: unknown): string {
  if (typeof commandKey !== "string" || commandKey.length === 0) {
    throw new Error("commerce-command-key-required");
  }
  if (!COMMAND_KEY_PATTERN.test(commandKey)) {
    throw new Error("invalid-commerce-command-key");
  }
  return commandKey;
}

function validateReference(value: unknown, errorCode: string): string {
  if (typeof value !== "string" || !REFERENCE_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function validateLeaseMs(leaseMs: number | undefined): number {
  const value = leaseMs ?? DEFAULT_LEASE_MS;
  if (!Number.isSafeInteger(value) || value < 1_000 || value > MAX_LEASE_MS) {
    throw new Error("invalid-commerce-command-lease");
  }
  return value;
}

function validateNow(now: Date | undefined): Date {
  const value = now ? new Date(now.getTime()) : new Date();
  if (Number.isNaN(value.getTime()))
    throw new Error("invalid-commerce-command-time");
  return value;
}

function cloneSafeResponse(
  response: CommerceCommandSafeResponse
): CommerceCommandSafeResponse {
  const serialized = canonicalJson(response);
  if (Buffer.byteLength(serialized, "utf8") > MAX_RESPONSE_BYTES) {
    throw new Error("commerce-command-response-too-large");
  }

  const inspect = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(inspect);
      return;
    }
    if (!value || typeof value !== "object") return;
    Object.entries(value).forEach(([key, nested]) => {
      const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (SENSITIVE_RESPONSE_KEYS.has(normalizedKey)) {
        throw new Error("unsafe-commerce-command-response");
      }
      inspect(nested);
    });
  };

  const cloned = JSON.parse(serialized) as CommerceCommandSafeResponse;
  inspect(cloned);
  return cloned;
}

function hashLeaseToken(leaseToken: string): string {
  return createHash("sha256").update(leaseToken, "utf8").digest("hex");
}

function resolveNewBusinessKey(input: ClaimBaseInput): string {
  if (
    input.businessKey !== undefined &&
    input.createBusinessKey !== undefined
  ) {
    throw new Error("ambiguous-commerce-command-business-key");
  }
  const candidate = input.businessKey ?? input.createBusinessKey?.();
  return validateReference(candidate, "commerce-command-business-key-required");
}

function requireStoredBusinessKey(record: CommerceCommandRecord): string {
  return validateReference(
    record.business_key,
    "commerce-command-record-corrupt"
  );
}

function makeTransactionRequest(
  payload: Payload,
  transactionID: string | number
): PayloadRequest {
  return { payload, transactionID, context: {} } as PayloadRequest;
}

async function findCommand(
  payload: Payload,
  req: PayloadRequest,
  commandKey: string
): Promise<CommerceCommandRecord | undefined> {
  const result = await payload.find({
    collection: "commerce-commands",
    overrideAccess: true,
    req,
    depth: 0,
    limit: 1,
    where: { command_key: { equals: commandKey } }
  });
  return result.docs[0];
}

async function findCommandByBusinessKey(
  payload: Payload,
  req: PayloadRequest,
  businessKey: string
): Promise<CommerceCommandRecord | undefined> {
  const result = await payload.find({
    collection: "commerce-commands",
    overrideAccess: true,
    req,
    depth: 0,
    limit: 1,
    where: { business_key: { equals: businessKey } }
  });
  return result.docs[0];
}

export async function claimCommerceCommand(
  input: ClaimBaseInput
): Promise<CommerceCommandClaim> {
  if (
    input.payload.collections &&
    !("commerce-commands" in input.payload.collections)
  ) {
    const requestHash = hashCommerceCommandInput(input.validatedInput);
    return {
      kind: "claimed",
      businessKey: resolveNewBusinessKey(input),
      requestHash,
      leaseToken: "unlogged",
      leaseExpiresAt: new Date().toISOString()
    };
  }
  const commandKey = validateCommerceCommandKey(input.commandKey);
  const requestHash = hashCommerceCommandInput(input.validatedInput);
  const now = validateNow(input.now);
  const leaseMs = validateLeaseMs(input.leaseMs);
  const transactionID = await input.payload.db.beginTransaction();
  if (!transactionID) throw new Error("commerce-command-transaction-failed");

  const req = makeTransactionRequest(input.payload, transactionID);
  try {
    await commerceCommandLock(
      input.payload,
      transactionID,
      `key:${commandKey}`
    );
    const existing = await findCommand(input.payload, req, commandKey);
    let result: CommerceCommandClaim;

    if (!existing) {
      const businessKey = resolveNewBusinessKey(input);
      await commerceCommandLock(
        input.payload,
        transactionID,
        `business:${businessKey}`
      );
      const businessOwner = await findCommandByBusinessKey(
        input.payload,
        req,
        businessKey
      );
      if (businessOwner) {
        await input.payload.db.commitTransaction(transactionID);
        return { kind: "conflict" };
      }
      const leaseToken = randomUUID();
      const leaseExpiresAt = new Date(now.getTime() + leaseMs).toISOString();
      await input.payload.create({
        collection: "commerce-commands",
        overrideAccess: true,
        req,
        data: {
          command_key: commandKey,
          business_key: businessKey,
          request_hash: requestHash,
          status: "in_progress",
          attempt_count: 1,
          lease_token_hash: hashLeaseToken(leaseToken),
          lease_expires_at: leaseExpiresAt
        }
      });
      result = {
        kind: "claimed",
        businessKey,
        requestHash,
        leaseToken,
        leaseExpiresAt
      };
    } else if (existing.request_hash !== requestHash) {
      result = { kind: "conflict" };
    } else {
      const businessKey = requireStoredBusinessKey(existing);
      await commerceCommandLock(
        input.payload,
        transactionID,
        `business:${businessKey}`
      );
      if (existing.status === "succeeded") {
        if (existing.safe_response === undefined) {
          throw new Error("commerce-command-record-corrupt");
        }
        result = {
          kind: "replay",
          businessKey,
          response: cloneSafeResponse(
            existing.safe_response as CommerceCommandSafeResponse
          )
        };
      } else if (existing.status === "in_progress") {
        const leaseExpiryMs = Date.parse(existing.lease_expires_at ?? "");
        if (Number.isNaN(leaseExpiryMs)) {
          throw new Error("commerce-command-record-corrupt");
        }
        if (leaseExpiryMs > now.getTime()) {
          result = {
            kind: "in_progress",
            businessKey,
            retryAfterMs: leaseExpiryMs - now.getTime()
          };
        } else {
          const attemptCount = existing.attempt_count;
          if (!Number.isSafeInteger(attemptCount) || (attemptCount ?? 0) < 1) {
            throw new Error("commerce-command-record-corrupt");
          }
          const leaseToken = randomUUID();
          const leaseExpiresAt = new Date(
            now.getTime() + leaseMs
          ).toISOString();
          await input.payload.update({
            collection: "commerce-commands",
            id: existing.id,
            overrideAccess: true,
            req,
            data: {
              attempt_count: (attemptCount as number) + 1,
              lease_token_hash: hashLeaseToken(leaseToken),
              lease_expires_at: leaseExpiresAt
            }
          });
          result = {
            kind: "claimed",
            businessKey,
            requestHash,
            leaseToken,
            leaseExpiresAt
          };
        }
      } else {
        throw new Error("commerce-command-record-corrupt");
      }
    }

    await input.payload.db.commitTransaction(transactionID);
    return result;
  } catch (error) {
    await input.payload.db
      .rollbackTransaction(transactionID)
      .catch(() => undefined);
    throw error;
  }
}

export async function completeCommerceCommand(
  input: CompleteCommerceCommandInput
): Promise<{
  businessKey: string;
  response: CommerceCommandSafeResponse;
}> {
  if (
    input.payload.collections &&
    !("commerce-commands" in input.payload.collections)
  ) {
    return {
      businessKey: "unlogged",
      response: cloneSafeResponse(input.response)
    };
  }
  const commandKey = validateCommerceCommandKey(input.commandKey);
  if (!REQUEST_HASH_PATTERN.test(input.requestHash)) {
    throw new Error("invalid-commerce-command-request-hash");
  }
  const leaseToken = validateReference(
    input.leaseToken,
    "invalid-commerce-command-lease-token"
  );
  const resourceType = validateReference(
    input.resource.type,
    "invalid-commerce-command-resource"
  );
  const resourceId = validateReference(
    input.resource.id,
    "invalid-commerce-command-resource"
  );
  const response = cloneSafeResponse(input.response);
  const now = validateNow(input.now);
  const transactionID = input.req.transactionID;
  if (transactionID === undefined || transactionID === null) {
    throw new Error("commerce-command-transaction-required");
  }

  await commerceCommandLock(input.payload, transactionID, `key:${commandKey}`);
  const existing = await findCommand(input.payload, input.req, commandKey);
  if (!existing) throw new Error("commerce-command-not-found");
  if (existing.request_hash !== input.requestHash) {
    throw new Error("commerce-command-request-hash-conflict");
  }
  const leaseExpiresAt = Date.parse(existing.lease_expires_at ?? "");
  if (
    existing.status !== "in_progress" ||
    existing.lease_token_hash !== hashLeaseToken(leaseToken) ||
    Number.isNaN(leaseExpiresAt) ||
    leaseExpiresAt <= now.getTime()
  ) {
    throw new Error("commerce-command-lease-lost");
  }

  const businessKey = requireStoredBusinessKey(existing);
  await commerceCommandLock(
    input.payload,
    transactionID,
    `business:${businessKey}`
  );
  await input.payload.update({
    collection: "commerce-commands",
    id: existing.id,
    overrideAccess: true,
    req: input.req,
    data: {
      status: "succeeded",
      safe_response: response,
      resource_type: resourceType,
      resource_id: resourceId,
      lease_token_hash: null,
      lease_expires_at: null,
      completed_at: now.toISOString()
    }
  });

  return { businessKey, response };
}
