import "server-only";

import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import { getServerSession } from "@/lib/auth/getServerSession";
import { canViewPaidLostOrder } from "./payment-recovery";

export async function verifyReturnedProductPayment(input: {
  orderRef?: string;
  paymentId?: string;
}) {
  const paymentId = input.paymentId ?? input.orderRef;
  if (!paymentId) {
    return { ok: false, status: 400, reason: "order-not-found" } as const;
  }

  const headers = await nextHeaders();
  const session = await getServerSession(headers);
  const payload = await getPayload({ config });
  try {
    const orders = await payload.find({
      collection: "orders",
      depth: 0,
      limit: 1,
      overrideAccess: true,
      where: {
        or: [
          { order_ref: { equals: paymentId } },
          ...(input.orderRef && input.orderRef !== paymentId
            ? [{ order_ref: { equals: input.orderRef } }]
            : [])
        ]
      }
    });
    const order = orders.docs[0] as
      | {
          order_ref?: string;
          customer?: string | { id?: string } | null;
          payment_status?: string;
        }
      | undefined;
    if (!order?.order_ref) {
      return { ok: false, status: 404, reason: "order-not-found" } as const;
    }
    const customer =
      typeof order.customer === "string"
        ? order.customer
        : order.customer && typeof order.customer.id === "string"
          ? order.customer.id
          : null;
    if (
      !canViewPaidLostOrder({
        customer,
        paymentStatus: order.payment_status,
        viewerId: session?.user?.id ? String(session.user.id) : null
      })
    ) {
      return { ok: false, status: 404, reason: "order-not-found" } as const;
    }
    return { ok: true, status: 200, orderRef: order.order_ref } as const;
  } catch {
    return { ok: false, status: 503, reason: "verify-unavailable" } as const;
  }
}
