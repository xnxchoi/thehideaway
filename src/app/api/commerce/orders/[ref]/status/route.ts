import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";
import { transitionOrderStatus } from "@/lib/commerce/transition-order-status";

const BodySchema = z
  .object({
    status: z.enum(["preparing", "shipped", "completed"]),
    trackingNumber: z.string().trim().min(1).max(128).optional()
  })
  .strict();

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ ref: string }> }
): Promise<NextResponse> {
  if (!isSameOrigin(req)) {
    return NextResponse.json(
      { success: false, error: "bad-origin" },
      { status: 403 }
    );
  }
  const payload = await getPayload({ config });
  const auth = await payload.auth({ headers: await nextHeaders() });
  if (!auth.user) {
    return NextResponse.json(
      { success: false, error: "unauthorized" },
      { status: 401 }
    );
  }
  if (auth.user.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "forbidden" },
      { status: 403 }
    );
  }
  const limited = await rateLimitOr429(req, "mutation", String(auth.user.id));
  if (limited) return limited;
  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { success: false, error: "bad-request" },
      { status: 400 }
    );
  }

  try {
    const { ref } = await context.params;
    const order = await transitionOrderStatus({
      repository: createPayloadCommerceRepository(payload),
      orderRef: ref,
      status: body.data.status,
      trackingNumber: body.data.trackingNumber
    });
    return NextResponse.json({ success: true, data: { order } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = code === "order-not-found" ? 404 : 409;
    if (
      [
        "order-not-found",
        "order-not-paid",
        "invalid-order-transition"
      ].includes(code)
    ) {
      return NextResponse.json({ success: false, error: code }, { status });
    }
    payload.logger?.error?.("[commerce/orders/status] transition failed");
    return NextResponse.json(
      { success: false, error: "status-transition-failed" },
      { status: 500 }
    );
  }
}
