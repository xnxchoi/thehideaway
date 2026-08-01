import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createLocalReq, getPayload } from "payload";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { getServerSession } from "@/lib/auth/getServerSession";
import {
  hashCommerceCommandInput,
  validateCommerceCommandKey
} from "@/lib/lost-commerce/commerce-commands";
import { runInventoryReservationOperatorCommand } from "@/lib/lost-commerce/inventory-reservation-operator-operations";

const Reference = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[A-Za-z0-9_.:~/-]+$/);
const Common = {
  expectedStateHash: z.string().regex(/^[a-f0-9]{64}$/),
  reasonCode: Reference.max(100),
  evidenceReference: Reference
};
const CommandSchema = z.discriminatedUnion("action", [
  z
    .object({ action: z.literal("release"), orderId: Reference, ...Common })
    .strict(),
  z
    .object({ action: z.literal("expire"), orderId: Reference, ...Common })
    .strict(),
  z
    .object({ action: z.literal("reconcile"), orderId: Reference, ...Common })
    .strict(),
  z
    .object({
      action: z.literal("run_expiry"),
      ...Common,
      batchSize: z.number().int().min(1).max(100).optional()
    })
    .strict()
]);

const MAX_BODY_BYTES = 16 * 1024;

async function readBody(req: NextRequest): Promise<unknown> {
  const declared = req.headers.get("content-length");
  if (declared && Number(declared) > MAX_BODY_BYTES) {
    throw new Error("inventory-reservation-operator-body-too-large");
  }
  const body = await req.text();
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new Error("inventory-reservation-operator-body-too-large");
  }
  return JSON.parse(body) as unknown;
}

function resultResponse(
  result: Awaited<ReturnType<typeof runInventoryReservationOperatorCommand>>
) {
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
  return NextResponse.json(
    {
      ok: true,
      data: {
        resourceId: result.resourceId,
        status: result.status,
        affectedCount: result.affectedCount,
        stateHash: result.stateHash
      }
    },
    result.kind === "replay"
      ? { headers: { "Idempotent-Replay": "true" } }
      : undefined
  );
}

type KnownOperationError = Readonly<{
  errorCode: string;
  response: NextResponse;
}>;

function knownError(error: unknown): KnownOperationError | null {
  const code = error instanceof Error ? error.message : "";
  if (code === "inventory-reservation-operator-mutations-disabled") {
    return {
      errorCode: code,
      response: NextResponse.json({ ok: false, error: code }, { status: 503 })
    };
  }
  if (code === "inventory-reservation-operator-order-not-found") {
    return {
      errorCode: code,
      response: NextResponse.json({ ok: false, error: code }, { status: 404 })
    };
  }
  const conflictCode = new Map<string, string>([
    [
      "inventory-reservation-operator-state-conflict",
      "inventory-reservation-operator-state-conflict"
    ],
    [
      "inventory-reservation-operator-release-forbidden",
      "inventory-reservation-release-forbidden"
    ],
    [
      "inventory-reservation-release-forbidden",
      "inventory-reservation-release-forbidden"
    ],
    [
      "inventory-reservation-release-no-effect",
      "inventory-reservation-release-no-effect"
    ],
    [
      "inventory-reservation-operator-not-expired",
      "inventory-reservation-not-expired"
    ],
    ["inventory-reservation-not-expired", "inventory-reservation-not-expired"],
    [
      "inventory-reservation-recovery-balance-changed",
      "inventory-reservation-balance-changed"
    ],
    [
      "inventory-reservation-balance-changed",
      "inventory-reservation-balance-changed"
    ]
  ]).get(code);
  if (conflictCode) {
    return {
      errorCode: conflictCode,
      response: NextResponse.json(
        { ok: false, error: conflictCode },
        { status: 409 }
      )
    };
  }
  if (
    [
      "commerce-command-transaction-failed",
      "commerce-command-rollback-failed",
      "inventory-reservation-operator-transaction-failed",
      "inventory-reservation-operator-rollback-failed",
      "inventory-reservation-operator-failure-evidence-failed"
    ].includes(code)
  ) {
    return {
      errorCode: "inventory-reservation-operator-unavailable",
      response: NextResponse.json(
        { ok: false, error: "inventory-reservation-operator-unavailable" },
        { status: 503 }
      )
    };
  }
  return null;
}

function logRejectedCommand(input: {
  logger: { error?: (value: unknown) => void };
  actorId: string;
  action: string;
  commandKeyHash: string;
  errorCode: string;
  unexpected?: boolean;
}): void {
  input.logger.error?.({
    code: input.unexpected
      ? "lost-inventory-reservation-command-failed"
      : "lost-inventory-reservation-command-rejected",
    actorId: input.actorId,
    action: input.action,
    commandKeyHash: input.commandKeyHash,
    errorCode: input.errorCode
  });
}

function actionForLog(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return "unknown";
  }
  const action = (value as { action?: unknown }).action;
  return typeof action === "string" &&
    ["release", "expire", "reconcile", "run_expiry"].includes(action)
    ? action
    : "unknown";
}

function commandKeyHash(input: {
  userId: string;
  clientCommandKey: string | null;
}): string {
  return hashCommerceCommandInput({
    endpoint: "lost/inventory/reservations/commands",
    userId: input.userId,
    key: input.clientCommandKey
  });
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
  const rawCommandKey = req.headers.get("idempotency-key");
  const preExecutionCommandKeyHash = commandKeyHash({
    userId: session.user.id,
    clientCommandKey: rawCommandKey
  });
  const limited = await rateLimitOr429(req, "mutation", session.user.id);
  if (limited) {
    if (session.user.role === "admin") {
      const payload = await getPayload({ config });
      logRejectedCommand({
        logger: payload.logger,
        actorId: session.user.id,
        action: "unknown",
        commandKeyHash: preExecutionCommandKeyHash,
        errorCode: "rate-limited"
      });
    }
    return limited;
  }
  if (session.user.role !== "admin") {
    const payload = await getPayload({ config });
    logRejectedCommand({
      logger: payload.logger,
      actorId: session.user.id,
      action: "unknown",
      commandKeyHash: commandKeyHash({
        userId: session.user.id,
        clientCommandKey: rawCommandKey
      }),
      errorCode: "session-admin-required"
    });
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }
  const payload = await getPayload({ config });
  let body: unknown;
  try {
    body = await readBody(req);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "inventory-reservation-operator-body-too-large"
    ) {
      logRejectedCommand({
        logger: payload.logger,
        actorId: session.user.id,
        action: "unknown",
        commandKeyHash: preExecutionCommandKeyHash,
        errorCode: "request-too-large"
      });
      return NextResponse.json(
        { ok: false, error: "request-too-large" },
        { status: 413 }
      );
    }
    logRejectedCommand({
      logger: payload.logger,
      actorId: session.user.id,
      action: "unknown",
      commandKeyHash: preExecutionCommandKeyHash,
      errorCode: "malformed-json"
    });
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }
  const parsed = CommandSchema.safeParse(body);
  if (!parsed.success) {
    logRejectedCommand({
      logger: payload.logger,
      actorId: session.user.id,
      action: actionForLog(body),
      commandKeyHash: preExecutionCommandKeyHash,
      errorCode: "invalid-command"
    });
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }
  let clientCommandKey: string;
  try {
    clientCommandKey = validateCommerceCommandKey(rawCommandKey);
  } catch (error) {
    const code = error instanceof Error ? error.message : "bad-request";
    logRejectedCommand({
      logger: payload.logger,
      actorId: session.user.id,
      action: parsed.data.action,
      commandKeyHash: preExecutionCommandKeyHash,
      errorCode: "invalid-command-key"
    });
    return NextResponse.json({ ok: false, error: code }, { status: 400 });
  }
  const commandKey = commandKeyHash({
    userId: session.user.id,
    clientCommandKey
  });
  try {
    const payloadUser = await payload.findByID({
      collection: "users",
      id: session.user.id,
      depth: 0,
      overrideAccess: true
    });
    if (payloadUser.role !== "admin") {
      logRejectedCommand({
        logger: payload.logger,
        actorId: session.user.id,
        action: parsed.data.action,
        commandKeyHash: commandKey,
        errorCode: "persisted-admin-required"
      });
      return NextResponse.json(
        { ok: false, error: "forbidden" },
        { status: 403 }
      );
    }
    const payloadReq = await createLocalReq(
      { req: { headers: req.headers }, user: payloadUser },
      payload
    );
    const result = await runInventoryReservationOperatorCommand(parsed.data, {
      payload,
      req: payloadReq,
      commandKey
    });
    return resultResponse(result);
  } catch (error) {
    const known = knownError(error);
    logRejectedCommand({
      logger: payload.logger,
      actorId: session.user.id,
      action: parsed.data.action,
      commandKeyHash: commandKey,
      errorCode: known?.errorCode ?? "unexpected-error",
      unexpected: !known
    });
    if (known) return known.response;
    return NextResponse.json(
      { ok: false, error: "inventory-reservation-operator-failed" },
      { status: 500 }
    );
  }
}
