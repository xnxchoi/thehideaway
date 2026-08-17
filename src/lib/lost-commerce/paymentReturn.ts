import "server-only";

import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import { getServerSession } from "@/lib/auth/getServerSession";
import { createPayloadCommerceRepository } from "@/lib/commerce/payload-repository";
import { settleCardPayment } from "@/lib/commerce/settle-payment";
import { getPortOnePayment, requiresLiveChannel } from "./verify-payment";

export async function verifyReturnedProductPayment(input: {
  orderRef?: string;
  paymentId?: string;
}) {
  const paymentId = input.paymentId;
  if (!paymentId) {
    return { ok: false, status: 400, reason: "order-not-found" } as const;
  }

  const headers = await nextHeaders();
  const session = await getServerSession(headers);
  if (!session?.user?.id) {
    return { ok: false, status: 401, reason: "order-not-found" } as const;
  }

  const payload = await getPayload({ config });
  try {
    const order = await settleCardPayment({
      repository: createPayloadCommerceRepository(payload),
      gateway: {
        getPayment: getPortOnePayment,
        requireLiveChannel: requiresLiveChannel()
      },
      paymentId,
      userId: String(session.user.id),
      isAdmin: session.user.role === "admin"
    });
    if (input.orderRef && input.orderRef !== order.ref) {
      return { ok: false, status: 404, reason: "order-not-found" } as const;
    }
    return { ok: true, status: 200, orderRef: order.ref } as const;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "verify-unavailable";
    if (reason === "not-paid") {
      return { ok: false, status: 402, reason: "payment-failed" } as const;
    }
    if (reason === "order-not-found") {
      return { ok: false, status: 404, reason } as const;
    }
    return { ok: false, status: 503, reason: "verify-unavailable" } as const;
  }
}
