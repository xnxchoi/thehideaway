import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  createLocalReq,
  getPayload,
  NotFound,
  type Payload,
  type PayloadRequest
} from "payload";
import config from "@payload-config";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { getServerSession } from "@/lib/auth/getServerSession";
import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "@/lib/lost-commerce/commerce-commands";
import {
  INVENTORY_DISPOSITIONS,
  validateInventoryAdjustmentTransition
} from "@/lib/lost-commerce/inventory-ledger-contracts";
import { MAX_INVENTORY_OPERATION_LINES } from "@/lib/lost-commerce/inventory-operation-runtime";
import {
  adjustInventory,
  applyInventoryCycleCount,
  cancelInventoryCycleCount,
  cancelInventoryReceipt,
  closeInventoryReceipt,
  createInventoryCycleCount,
  createInventoryReceipt,
  openInventoryReceipt,
  receiveInventoryReceipt,
  rejectInventoryCycleCount,
  releaseInventoryLot,
  submitInventoryCycleCount,
  type InventoryOperationResult
} from "@/lib/lost-commerce/inventory-operations";

export const runtime = "nodejs";

const entityId = z.uuidv7();
const reference = z.string().regex(/^[A-Za-z0-9_.:~/-]{1,200}$/);
const positiveQuantity = z.number().int().min(1).max(Number.MAX_SAFE_INTEGER);
const nonnegativeQuantity = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);
const optionalText = z.string().trim().min(1).max(200).optional();
const disposition = z.enum(INVENTORY_DISPOSITIONS);
const endpoint = z.strictObject({ locationId: entityId, disposition });
const MAX_COMMAND_BODY_BYTES = 256 * 1024;

const receiptIdInput = z.strictObject({ receiptId: entityId });
const countIdInput = z.strictObject({ countId: entityId });
const outboundAdjustment = z
  .strictObject({
    skuId: entityId,
    kind: z.literal("outbound"),
    quantity: positiveQuantity,
    from: endpoint,
    reasonCode: reference,
    sourceRef: reference.optional()
  })
  .superRefine((input, context) => {
    try {
      validateInventoryAdjustmentTransition(input);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "invalid-transition"
      });
    }
  });

const transferAdjustment = z
  .strictObject({
    skuId: entityId,
    kind: z.literal("transfer"),
    quantity: positiveQuantity,
    from: endpoint,
    to: endpoint,
    reasonCode: reference,
    sourceRef: reference.optional()
  })
  .superRefine((input, context) => {
    try {
      validateInventoryAdjustmentTransition(input);
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "invalid-transition"
      });
    }
  });

const CommandSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("receipt.create"),
    input: z.strictObject({
      locationId: entityId,
      supplierName: optionalText,
      externalReference: optionalText,
      lines: z
        .array(
          z.strictObject({
            skuId: entityId,
            expectedQuantity: positiveQuantity.optional()
          })
        )
        .min(1)
        .max(MAX_INVENTORY_OPERATION_LINES)
    })
  }),
  z.strictObject({ action: z.literal("receipt.open"), input: receiptIdInput }),
  z.strictObject({
    action: z.literal("receipt.receive"),
    input: z.strictObject({
      receiptId: entityId,
      receiptLineId: entityId,
      quantity: positiveQuantity,
      externalLotCode: optionalText
    })
  }),
  z.strictObject({ action: z.literal("receipt.close"), input: receiptIdInput }),
  z.strictObject({
    action: z.literal("receipt.cancel"),
    input: receiptIdInput
  }),
  z.strictObject({
    action: z.literal("lot.release"),
    input: z.strictObject({ lotId: entityId, quantity: positiveQuantity })
  }),
  z.strictObject({
    action: z.literal("inventory.adjust"),
    input: z.union([outboundAdjustment, transferAdjustment])
  }),
  z.strictObject({
    action: z.literal("cycle-count.create"),
    input: z.strictObject({
      locationId: entityId,
      lines: z
        .array(
          z.strictObject({
            skuId: entityId,
            disposition,
            countedQuantity: nonnegativeQuantity
          })
        )
        .min(1)
        .max(MAX_INVENTORY_OPERATION_LINES)
    })
  }),
  z.strictObject({
    action: z.literal("cycle-count.submit"),
    input: countIdInput
  }),
  z.strictObject({
    action: z.literal("cycle-count.apply"),
    input: countIdInput
  }),
  z.strictObject({
    action: z.literal("cycle-count.reject"),
    input: countIdInput
  }),
  z.strictObject({
    action: z.literal("cycle-count.cancel"),
    input: countIdInput
  })
]);

type InventoryCommand = z.infer<typeof CommandSchema>;
type OperationContext = {
  payload: Payload;
  req: PayloadRequest;
  commandKey: string;
};

const BAD_REQUEST_ERRORS = new Set([
  "invalid-inventory-operation-quantity",
  "inventory-cycle-count-duplicate-aggregate",
  "inventory-cycle-count-lines-required",
  "inventory-lot-release-workflow-required",
  "inventory-positive-adjustment-requires-provenance",
  "inventory-receipt-duplicate-sku",
  "inventory-receipt-lines-required",
  "inventory-transfer-endpoints-match"
]);

const CONFLICT_ERRORS = new Set([
  "inventory-cycle-count-apply-invalid-status",
  "inventory-cycle-count-cancel-invalid-status",
  "inventory-cycle-count-reject-invalid-status",
  "inventory-cycle-count-snapshot-stale",
  "inventory-cycle-count-submit-invalid-status",
  "inventory-location-inactive",
  "inventory-lot-release-exceeds-remaining",
  "inventory-projection-expectation-stale",
  "inventory-receipt-cancel-invalid-status",
  "inventory-receipt-cancel-has-receipts",
  "inventory-receipt-close-invalid-status",
  "inventory-receipt-line-mismatch",
  "inventory-receipt-open-invalid-status",
  "inventory-receipt-receive-invalid-status",
  "inventory-sku-inactive",
  "insufficient-inventory-balance"
]);

async function readCommandBody(req: NextRequest): Promise<unknown> {
  const contentLength = Number(req.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_COMMAND_BODY_BYTES
  ) {
    throw new Error("inventory-command-body-too-large");
  }
  if (!req.body) return null;

  const reader = req.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let bytesRead = 0;
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_COMMAND_BODY_BYTES) {
      await reader.cancel().catch(() => undefined);
      throw new Error("inventory-command-body-too-large");
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return JSON.parse(text);
}

function runCommand(
  command: InventoryCommand,
  context: OperationContext
): Promise<InventoryOperationResult> {
  switch (command.action) {
    case "receipt.create":
      return createInventoryReceipt({ ...context, input: command.input });
    case "receipt.open":
      return openInventoryReceipt({ ...context, input: command.input });
    case "receipt.receive":
      return receiveInventoryReceipt({ ...context, input: command.input });
    case "receipt.close":
      return closeInventoryReceipt({ ...context, input: command.input });
    case "receipt.cancel":
      return cancelInventoryReceipt({ ...context, input: command.input });
    case "lot.release":
      return releaseInventoryLot({ ...context, input: command.input });
    case "inventory.adjust":
      return adjustInventory({ ...context, input: command.input });
    case "cycle-count.create":
      return createInventoryCycleCount({ ...context, input: command.input });
    case "cycle-count.submit":
      return submitInventoryCycleCount({ ...context, input: command.input });
    case "cycle-count.apply":
      return applyInventoryCycleCount({ ...context, input: command.input });
    case "cycle-count.reject":
      return rejectInventoryCycleCount({ ...context, input: command.input });
    case "cycle-count.cancel":
      return cancelInventoryCycleCount({ ...context, input: command.input });
  }
}

function operationData(value: unknown): {
  resourceId: string;
  status: string;
} | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.resourceId !== "string" || !record.resourceId) return null;
  if (typeof record.status !== "string" || !record.status) return null;
  return { resourceId: record.resourceId, status: record.status };
}

function resultResponse(result: InventoryOperationResult): NextResponse {
  if (result.kind === "conflict") {
    return NextResponse.json(
      { ok: false, error: "idempotency-key-conflict" },
      { status: 409 }
    );
  }
  if (result.kind === "in_progress") {
    return NextResponse.json(
      { ok: false, error: "idempotency-in-progress" },
      {
        status: 409,
        headers: {
          "Retry-After": String(
            Math.max(1, Math.ceil(result.retryAfterMs / 1000))
          )
        }
      }
    );
  }

  const data = operationData(
    result.kind === "replay" ? result.response : result
  );
  if (!data) {
    throw new Error("inventory-command-result-invalid");
  }
  return NextResponse.json(
    { ok: true, data },
    result.kind === "replay"
      ? { headers: { "Idempotent-Replay": "true" } }
      : undefined
  );
}

function knownErrorResponse(error: unknown): NextResponse | null {
  if (error instanceof NotFound) {
    return NextResponse.json(
      { ok: false, error: "inventory-operation-record-not-found" },
      { status: 404 }
    );
  }
  const reason = error instanceof Error ? error.message : "";
  if (BAD_REQUEST_ERRORS.has(reason)) {
    return NextResponse.json({ ok: false, error: reason }, { status: 400 });
  }
  if (reason === "inventory-operation-record-not-found") {
    return NextResponse.json({ ok: false, error: reason }, { status: 404 });
  }
  if (
    reason === "inventory-location-not-found" ||
    reason === "inventory-sku-not-found"
  ) {
    return NextResponse.json({ ok: false, error: reason }, { status: 404 });
  }
  if (reason === "inventory-cycle-count-self-approval-forbidden") {
    return NextResponse.json({ ok: false, error: reason }, { status: 403 });
  }
  if (CONFLICT_ERRORS.has(reason)) {
    return NextResponse.json({ ok: false, error: reason }, { status: 409 });
  }
  if (
    reason === "commerce-command-transaction-failed" ||
    reason === "inventory-operation-transaction-failed" ||
    reason === "inventory-movement-transaction-failed"
  ) {
    return NextResponse.json(
      { ok: false, error: "inventory-command-unavailable" },
      { status: 503 }
    );
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { ok: false, error: "bad-origin" },
      { status: 403 }
    );
  }

  const session = await getServerSession(await nextHeaders());
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }

  const limited = await rateLimitOr429(req, "mutation", session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await readCommandBody(req);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "inventory-command-body-too-large"
    ) {
      return NextResponse.json(
        { ok: false, error: "request-too-large" },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  const parsed = CommandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }

  let clientCommandKey: string;
  try {
    clientCommandKey = validateCommerceCommandKey(
      req.headers.get("idempotency-key")
    );
  } catch (error) {
    const reason = error instanceof Error ? error.message : "bad-request";
    return NextResponse.json({ ok: false, error: reason }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const commandKey = hashCommerceCommandInput({
    endpoint: "lost/inventory/commands",
    userId: session.user.id,
    key: clientCommandKey
  });
  try {
    const payloadUser = await payload.findByID({
      collection: "users",
      id: session.user.id,
      depth: 0,
      overrideAccess: true
    });
    if (payloadUser.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }
    const payloadReq = await createLocalReq(
      {
        req: { headers: req.headers },
        user: payloadUser
      },
      payload
    );
    const result = await runCommand(parsed.data, {
      payload,
      req: payloadReq,
      commandKey
    });
    return resultResponse(result);
  } catch (error) {
    const knownResponse = knownErrorResponse(error);
    if (knownResponse) return knownResponse;

    payload.logger.error?.({
      code: "lost-inventory-command-failed",
      context: "POST /api/lost/inventory/commands",
      action: parsed.data.action
    });
    return NextResponse.json(
      { ok: false, error: "inventory-command-failed" },
      { status: 500 }
    );
  }
}
