import { randomUUID } from "node:crypto";
import type { Payload, PayloadRequest } from "payload";
import {
  claimCommerceCommand,
  completeCommerceCommand,
  hashCommerceCommandInput,
  type CommerceCommandBinding,
  type CommerceCommandSafeResponse
} from "@/lib/lost-commerce/commerce-commands";

type OperatorCommandInput = {
  payload: Payload;
  /** A server-authenticated request, never an actor parsed from command JSON. */
  req: PayloadRequest;
  commandKey: unknown;
  operation: string;
  resource: { type: string; id: string };
  reasonCode: string;
  auditSource: string;
  validatedInput: unknown;
  now?: Date;
  leaseMs?: number;
};
export type OperatorCommandResponse = {
  orderId: string;
  status?: string;
  fulfillmentStatus?: string;
  commandId?: string;
};
const RESPONSE_KEYS = new Set([
  "orderId",
  "status",
  "fulfillmentStatus",
  "commandId"
]);

function bindingFor(input: OperatorCommandInput): CommerceCommandBinding {
  const user = input.req.user;
  if (
    !user ||
    user.collection !== "users" ||
    user.role !== "admin" ||
    typeof user.id !== "string"
  ) {
    throw new Error("operator-command-forbidden");
  }
  return {
    actorId: user.id,
    operation: input.operation,
    resource: { ...input.resource },
    reasonCode: input.reasonCode,
    auditSource: input.auditSource
  };
}

function safeResponse(
  response: CommerceCommandSafeResponse
): OperatorCommandResponse {
  if (
    !response ||
    typeof response !== "object" ||
    Array.isArray(response) ||
    !Object.hasOwn(response, "orderId") ||
    Object.entries(response).some(
      ([key, value]) =>
        !RESPONSE_KEYS.has(key) ||
        typeof value !== "string" ||
        value.length < 1 ||
        value.length > 200 ||
        !/^[A-Za-z0-9_.:~/-]+$/.test(value)
    )
  ) {
    throw new Error("unsafe-operator-command-response");
  }
  return { ...response } as OperatorCommandResponse;
}

/** The domain service authorizes the target and validates input before this claim. */
export async function claimOperatorCommand(input: OperatorCommandInput) {
  const binding = bindingFor(input);
  const result = await claimCommerceCommand({
    payload: input.payload,
    commandKey: input.commandKey,
    validatedInput: input.validatedInput,
    binding,
    createBusinessKey: () => `operator:${randomUUID()}`,
    now: input.now,
    leaseMs: input.leaseMs
  });
  return result.kind === "replay"
    ? { ...result, response: safeResponse(result.response) }
    : result;
}

/** Commit this row together with domain writes in the caller's transaction. */
export async function completeOperatorCommand(
  input: OperatorCommandInput & {
    requestHash: string;
    leaseToken: string;
    response: OperatorCommandResponse;
  }
) {
  const binding = bindingFor(input);
  if (
    hashCommerceCommandInput({ binding, input: input.validatedInput }) !==
    input.requestHash
  ) {
    throw new Error("commerce-command-request-hash-conflict");
  }
  return completeCommerceCommand({
    payload: input.payload,
    req: input.req,
    commandKey: input.commandKey,
    binding,
    requestHash: input.requestHash,
    leaseToken: input.leaseToken,
    resource: binding.resource,
    response: safeResponse(input.response),
    now: input.now
  });
}
