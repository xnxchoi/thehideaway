import "server-only";

import config from "@payload-config";
import { headers as nextHeaders } from "next/headers";
import { getPayload } from "payload";
import { getServerSession } from "@/lib/auth/getServerSession";
import { cancelUnpaidProductOrder } from "./orders";

export async function cancelReturnedProductOrder(
  orderRef?: string
): Promise<void> {
  if (!orderRef) return;

  const headers = await nextHeaders();
  const session = await getServerSession(headers);
  if (!session?.user?.id) return;

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "product-orders" as never,
    depth: 0,
    limit: 1,
    overrideAccess: true,
    where: {
      and: [
        { order_ref: { equals: orderRef } },
        { user: { equals: String(session.user.id) } }
      ]
    } as never
  });

  const order = result.docs[0] as Record<string, unknown> | undefined;
  if (!order) return;

  await cancelUnpaidProductOrder({ payload, order }).catch((err) => {
    payload.logger.error?.(
      `[lost/payment/return] failed to cancel ${orderRef}: ${(err as Error).message}`
    );
  });
}
