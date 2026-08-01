import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { createLocalReq, getPayload } from "payload";

import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { getServerSession } from "@/lib/auth/getServerSession";
import { listInventoryReservationOperatorQueue } from "@/lib/lost-commerce/inventory-reservation-operator-queries";

const QUEUES = new Set([
  "active",
  "expiring",
  "stuck",
  "paid_inventory_review"
]);

function positiveInteger(
  value: string | null,
  fallback: number
): number | null {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function logRejectedQueue(input: {
  logger: { error?: (value: unknown) => void };
  actorId: string;
  errorCode: string;
}): void {
  input.logger.error?.({
    code: "lost-inventory-reservation-queue-rejected",
    actorId: input.actorId,
    errorCode: input.errorCode
  });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(await nextHeaders());
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  const limited = await rateLimitOr429(req, "auth", session.user.id);
  if (limited) return limited;
  if (session.user.role !== "admin") {
    const payload = await getPayload({ config });
    logRejectedQueue({
      logger: payload.logger,
      actorId: session.user.id,
      errorCode: "session-admin-required"
    });
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 }
    );
  }
  const queue = req.nextUrl.searchParams.get("queue") ?? "active";
  const limit = positiveInteger(req.nextUrl.searchParams.get("limit"), 25);
  const horizon = positiveInteger(
    req.nextUrl.searchParams.get("horizonMinutes"),
    15
  );
  if (
    !QUEUES.has(queue) ||
    !limit ||
    limit > 100 ||
    !horizon ||
    horizon > 1440
  ) {
    return NextResponse.json(
      { ok: false, error: "bad-request" },
      { status: 400 }
    );
  }
  const payload = await getPayload({ config });
  try {
    const payloadUser = await payload.findByID({
      collection: "users",
      id: session.user.id,
      depth: 0,
      overrideAccess: true
    });
    if (payloadUser.role !== "admin") {
      logRejectedQueue({
        logger: payload.logger,
        actorId: session.user.id,
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
    const data = await listInventoryReservationOperatorQueue({
      payload,
      req: payloadReq,
      queue: queue as "active" | "expiring" | "stuck" | "paid_inventory_review",
      limit,
      expiringHorizonMinutes: horizon
    });
    return NextResponse.json(
      { ok: true, data },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    payload.logger.error?.({
      code: "lost-inventory-reservation-queue-failed",
      context: "GET /api/lost/inventory/reservations"
    });
    return NextResponse.json(
      { ok: false, error: "inventory-reservation-queue-failed" },
      { status: 500 }
    );
  }
}
