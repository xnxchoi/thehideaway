import type { Payload } from "payload";
import type { ProductOrderCampaign } from "@/payload-types";
import { campaignCommitmentLock } from "@/lib/db/sequences";
import {
  assertOrderTransition,
  CommerceTransitionError,
  isCommerceOrderState
} from "./transitions";
import { authorizeCommerceLifecycleRequest } from "./lifecycle-authorization";

type RequestOrderRecord = {
  id: string;
  order_mode?: unknown;
  campaign?: string | { id?: string | null } | null;
  status?: unknown;
};

const campaignActor = { kind: "system", id: "campaign" } as const;

export async function claimRequestOrderCapacity(input: {
  payload: Payload;
  campaignId: string;
  productId: string;
  skuIds: readonly string[];
  req?: Record<string, unknown>;
}): Promise<void> {
  const transactionID = input.req?.transactionID as string | number | undefined;
  if (!transactionID) throw new Error("transaction-required");

  await campaignCommitmentLock(input.payload, transactionID, input.campaignId);
  const campaign = (await input.payload.findByID({
    collection: "product-order-campaigns",
    id: input.campaignId,
    depth: 0,
    disableErrors: true,
    req: input.req,
    overrideAccess: true
  })) as ProductOrderCampaign | null;
  if (!campaign || campaign.state !== "open") {
    throw new Error("campaign-not-open");
  }
  if (new Date(campaign.deadline).getTime() < Date.now()) {
    throw new Error("campaign-ended");
  }
  const maximumCommitments = campaign.maximum_commitments;
  if (
    typeof maximumCommitments === "number" &&
    Number.isFinite(maximumCommitments)
  ) {
    throw new Error("campaign-capacity-reservations-unavailable");
  }

  const campaignProductId =
    typeof campaign.product === "string"
      ? campaign.product
      : String(campaign.product?.id ?? "");
  if (campaignProductId !== input.productId) {
    throw new Error("campaign-not-open");
  }

  const eligibleSkuIds = new Set(
    (campaign.eligible_skus ?? []).flatMap((value) => {
      const id = typeof value === "string" ? value : value?.id;
      return typeof id === "string" ? [id] : [];
    })
  );
  if (input.skuIds.some((skuId) => !eligibleSkuIds.has(skuId))) {
    throw new Error("campaign-sku-ineligible");
  }
}

export async function markRequestOrderPaid(input: {
  payload: Payload;
  order: RequestOrderRecord;
  req?: Record<string, unknown>;
}): Promise<void> {
  const campaignId =
    typeof input.order.campaign === "string"
      ? input.order.campaign
      : input.order.campaign?.id;
  if (input.order.order_mode !== "request_to_order" || !campaignId) return;

  const transactionID = input.req?.transactionID as string | number | undefined;
  if (!transactionID) throw new Error("transaction-required");
  authorizeCommerceLifecycleRequest(input.req as object);
  await campaignCommitmentLock(input.payload, transactionID, campaignId);

  const campaign = (await input.payload.findByID({
    collection: "product-order-campaigns",
    id: campaignId,
    depth: 0,
    req: input.req,
    overrideAccess: true
  })) as ProductOrderCampaign;

  const paidCommitments = Number(campaign.paid_commitments ?? 0) + 1;
  const minimumCommitments = Number(campaign.minimum_commitments ?? 1);
  const thresholdMet = paidCommitments >= minimumCommitments;
  const nextOrderStatus = thresholdMet ? "confirmed" : "committed";

  if (!isCommerceOrderState(input.order.status)) {
    throw new CommerceTransitionError("invalid-commerce-transition");
  }
  assertOrderTransition({
    from: input.order.status,
    to: nextOrderStatus,
    actor: campaignActor
  });

  const committedOrders = thresholdMet
    ? await input.payload.find({
        collection: "product-orders",
        depth: 0,
        pagination: false,
        req: input.req,
        overrideAccess: true,
        where: {
          and: [
            { campaign: { equals: campaignId } },
            { payment_status: { equals: "paid" } },
            { status: { equals: "committed" } }
          ]
        }
      })
    : { docs: [] };

  const committedOrderDocs = committedOrders.docs as Array<{
    id: string;
    status?: unknown;
  }>;
  for (const order of committedOrderDocs) {
    if (!isCommerceOrderState(order.status)) {
      throw new CommerceTransitionError("invalid-commerce-transition");
    }
    assertOrderTransition({
      from: order.status,
      to: "confirmed",
      actor: campaignActor
    });
  }

  await input.payload.update({
    collection: "product-order-campaigns",
    id: campaignId,
    req: input.req,
    overrideAccess: true,
    data: {
      paid_commitments: paidCommitments,
      state: thresholdMet ? "met" : campaign.state
    }
  });

  await input.payload.update({
    collection: "product-orders",
    id: input.order.id,
    req: input.req,
    overrideAccess: true,
    data: {
      status: nextOrderStatus,
      fulfillment_status: thresholdMet ? "in_production" : "reserved"
    }
  });

  for (const order of committedOrderDocs) {
    await input.payload.update({
      collection: "product-orders",
      id: String(order.id),
      req: input.req,
      overrideAccess: true,
      data: {
        status: "confirmed",
        fulfillment_status: "in_production"
      }
    });
  }
}
