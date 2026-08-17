import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { z } from "zod";

import { isSameOrigin } from "@/lib/api/isSameOrigin";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { createCommerceOrder } from "@/lib/commerce/create-order";
import { isMinimalCommerceCardReady } from "@/lib/commerce/payment-readiness";
import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";
import { buildPortOnePaymentPayload } from "@/lib/lost-commerce/portone";

const BodySchema = z
  .object({
    productId: z.string().trim().min(1).max(128),
    quantity: z.number().int().min(1).max(99),
    paymentMethod: z.enum(["card", "bank_transfer"]),
    contact: z
      .object({
        name: z.string().trim().min(1).max(100),
        email: z.email().max(320),
        phone: z.string().trim().min(7).max(32).optional()
      })
      .strict(),
    shipping: z
      .object({
        address: z.string().trim().min(1).max(500),
        addressDetail: z.string().trim().max(300).optional(),
        postalCode: z.string().trim().max(32).optional()
      })
      .strict()
  })
  .strict();

const PUBLIC_ERRORS = new Map<string, number>([
  ["invalid-idempotency-key", 400],
  ["idempotency-conflict", 409],
  ["product-unavailable", 404],
  ["quantity-unavailable", 409],
  ["invalid-unit-amount", 409],
  ["invalid-total-amount", 409],
  ["card-unavailable", 503]
]);

function originOf(req: NextRequest): string {
  return req.headers.get("origin") ?? new URL(req.url).origin;
}

function bankAccount(): string | null {
  const value = process.env.NEXT_PUBLIC_BANK_ACCOUNT?.trim();
  return value && !value.toUpperCase().startsWith("CHANGE_ME") ? value : null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
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

  const limited = await rateLimitOr429(req, "mutation", String(auth.user.id));
  if (limited) return limited;

  const body = BodySchema.safeParse(await req.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json(
      { success: false, error: "bad-request" },
      { status: 400 }
    );
  }
  if (body.data.paymentMethod === "card" && !isMinimalCommerceCardReady()) {
    return NextResponse.json(
      { success: false, error: "card-unavailable" },
      { status: 503 }
    );
  }
  const transferAccount =
    body.data.paymentMethod === "bank_transfer" ? bankAccount() : null;
  if (body.data.paymentMethod === "bank_transfer" && !transferAccount) {
    return NextResponse.json(
      { success: false, error: "bank-transfer-unavailable" },
      { status: 503 }
    );
  }

  try {
    const result = await createCommerceOrder({
      repository: createPayloadCommerceRepository(payload),
      userId: String(auth.user.id),
      idempotencyKey: req.headers.get("idempotency-key") ?? "",
      command: {
        productId: body.data.productId,
        quantity: body.data.quantity,
        paymentMethod: body.data.paymentMethod
      },
      contact: body.data.contact,
      shipping: body.data.shipping
    });

    const nextAction =
      result.nextAction.type === "card"
        ? {
            ...result.nextAction,
            request: buildPortOnePaymentPayload({
              orderRef: result.order.ref,
              amount: result.order.money.totalAmount,
              currency: result.order.money.currency,
              origin: originOf(req),
              products: [
                {
                  id: result.order.product.id,
                  name: result.order.product.name,
                  amount: result.order.money.unitAmount,
                  quantity: result.order.quantity,
                  link: `${originOf(req)}/products/${result.order.product.slug}`
                }
              ]
            })
          }
        : {
            ...result.nextAction,
            account: transferAccount ?? undefined
          };

    return NextResponse.json(
      { success: true, data: { ...result, nextAction } },
      { status: 201 }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "";
    const status = PUBLIC_ERRORS.get(code);
    if (status) {
      return NextResponse.json({ success: false, error: code }, { status });
    }
    payload.logger?.error?.("[commerce/orders] order creation failed");
    return NextResponse.json(
      { success: false, error: "order-creation-failed" },
      { status: 500 }
    );
  }
}
