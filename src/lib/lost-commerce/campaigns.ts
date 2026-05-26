import type { Payload } from "payload";

type AnyDoc = Record<string, any>;

export async function markRequestOrderPaid(input: {
  payload: Payload;
  order: AnyDoc;
}): Promise<void> {
  const campaignId =
    typeof input.order.campaign === "string"
      ? input.order.campaign
      : input.order.campaign?.id;
  if (input.order.order_mode !== "request_to_order" || !campaignId) return;

  const campaign = (await input.payload.findByID({
    collection: "product-order-campaigns" as never,
    id: campaignId,
    depth: 0,
    overrideAccess: true
  })) as AnyDoc;

  const paidCommitments = Number(campaign.paid_commitments ?? 0) + 1;
  const minimumCommitments = Number(campaign.minimum_commitments ?? 1);
  const thresholdMet = paidCommitments >= minimumCommitments;

  await input.payload.update({
    collection: "product-order-campaigns" as never,
    id: campaignId,
    overrideAccess: true,
    data: {
      paid_commitments: paidCommitments,
      state: thresholdMet ? "met" : campaign.state
    } as never
  });

  await input.payload.update({
    collection: "product-orders" as never,
    id: input.order.id,
    overrideAccess: true,
    data: {
      status: thresholdMet ? "confirmed" : "committed",
      fulfillment_status: thresholdMet ? "in_production" : "reserved"
    } as never
  });

  if (!thresholdMet) return;

  const committedOrders = await input.payload.find({
    collection: "product-orders" as never,
    depth: 0,
    limit: 200,
    overrideAccess: true,
    where: {
      and: [
        { campaign: { equals: campaignId } },
        { payment_status: { equals: "paid" } },
        { status: { equals: "committed" } }
      ]
    } as never
  });

  await Promise.all(
    committedOrders.docs.map((order) =>
      input.payload.update({
        collection: "product-orders" as never,
        id: String(order.id),
        overrideAccess: true,
        data: {
          status: "confirmed",
          fulfillment_status: "in_production"
        } as never
      })
    )
  );
}
