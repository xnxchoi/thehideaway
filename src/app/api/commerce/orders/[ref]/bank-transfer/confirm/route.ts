import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";
import { settleBankTransfer } from "@/lib/commerce/settle-payment";

const BodySchema = z
  .object({ evidenceReference: z.string().trim().min(1).max(128) })
  .strict();

export async function POST(
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
    const order = await settleBankTransfer({
      repository: createPayloadCommerceRepository(payload),
      orderRef: ref,
      evidenceReference: body.data.evidenceReference
    });
    return NextResponse.json({ success: true, data: { order } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    if (code === "order-not-found") {
      return NextResponse.json(
        { success: false, error: code },
        { status: 404 }
      );
    }
    if (code === "payment-not-pending") {
      return NextResponse.json(
        { success: false, error: code },
        { status: 409 }
      );
    }
    payload.logger?.error?.("[commerce/bank-transfer] confirmation failed");
    return NextResponse.json(
      { success: false, error: "bank-confirmation-failed" },
      { status: 500 }
    );
  }
}
