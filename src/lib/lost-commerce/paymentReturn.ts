import "server-only";

import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import { getServerSession } from "@/lib/auth/getServerSession";
import { syncProductPayment } from "./product-payment";

export async function verifyReturnedProductPayment(input: {
  orderRef?: string;
  paymentId?: string;
}) {
  if (input.orderRef && input.paymentId && input.orderRef !== input.paymentId) {
    return { ok: false, status: 400, reason: "order-not-found" } as const;
  }
  const paymentId = input.paymentId || input.orderRef;
  if (!paymentId) {
    return { ok: false, status: 400, reason: "order-not-found" } as const;
  }

  const headers = await nextHeaders();
  const session = await getServerSession(headers);
  if (!session?.user?.id) {
    return { ok: false, status: 401, reason: "order-not-found" } as const;
  }

  const payload = await getPayload({ config });
  return syncProductPayment({
    payload,
    paymentId,
    expectedUserId: String(session.user.id)
  });
}
