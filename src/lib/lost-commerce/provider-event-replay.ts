import type { Payload } from "payload";
import type { CommerceProviderEvent } from "@/payload-types";

import { cancelPendingPlanPayment, syncPlanPayment } from "./plan-payment";
import { syncProductPayment } from "./product-payment";
import {
  claimCommerceProviderEvent,
  completeCommerceProviderEvent
} from "./provider-events";

type ReplayStatus = "processed" | "rejected" | "retryable";

export type CommerceProviderEventReplayResult =
  | { kind: "busy" }
  | {
      kind: "terminal";
      status: "processed" | "rejected";
      outcomeCode?: string;
    }
  | {
      kind: "completed";
      status: ReplayStatus;
      outcomeCode: string;
    };

function storedStatus(row: CommerceProviderEvent): string {
  const type = String(row.event_type ?? "").toUpperCase();
  if (type.includes("FAILED") || type.includes("CANCEL")) return "failed";
  if (type.includes("REFUND")) return "refunded";
  return String(row.provider_status ?? "").toLowerCase();
}

async function finishReplay(input: {
  payload: Payload;
  eventId: string;
  leaseToken: string;
  status: ReplayStatus;
  outcomeCode: string;
}): Promise<CommerceProviderEventReplayResult> {
  await completeCommerceProviderEvent(input);
  return {
    kind: "completed",
    status: input.status,
    outcomeCode: input.outcomeCode
  };
}

export async function replayCommerceProviderEvent(input: {
  payload: Payload;
  eventId: string;
}): Promise<CommerceProviderEventReplayResult> {
  const claim = await claimCommerceProviderEvent({
    ...input,
    allowRejectedReplay: true
  });
  if (claim.kind === "busy" || claim.kind === "terminal") return claim;

  let row: CommerceProviderEvent;
  try {
    row = await input.payload.findByID({
      collection: "commerce-provider-events",
      id: input.eventId,
      overrideAccess: true,
      depth: 0
    });
  } catch {
    return finishReplay({
      ...input,
      leaseToken: claim.leaseToken,
      status: "retryable",
      outcomeCode: "provider-event-read-unavailable"
    });
  }

  const paymentId = row.payment_ref;
  if (row.provider !== "portone" || !paymentId) {
    return finishReplay({
      ...input,
      leaseToken: claim.leaseToken,
      status: "rejected",
      outcomeCode:
        row.provider === "portone"
          ? "missing-payment-ref"
          : "unsupported-provider"
    });
  }

  let subscriptions;
  try {
    subscriptions = await input.payload.find({
      collection: "subscriptions",
      overrideAccess: true,
      depth: 0,
      limit: 1,
      where: { payment_ref: { equals: paymentId } }
    });
  } catch {
    return finishReplay({
      ...input,
      leaseToken: claim.leaseToken,
      status: "retryable",
      outcomeCode: "webhook-classification-unavailable"
    });
  }

  if (subscriptions.docs.length > 0) {
    const status = storedStatus(row);
    const result = await syncPlanPayment({
      payload: input.payload,
      paymentId
    });
    if (result.ok) {
      return finishReplay({
        ...input,
        leaseToken: claim.leaseToken,
        status: "processed",
        outcomeCode: "plan-payment-paid"
      });
    }
    if (result.reason === "verify-unavailable") {
      return finishReplay({
        ...input,
        leaseToken: claim.leaseToken,
        status: "retryable",
        outcomeCode: result.reason
      });
    }
    if (status === "failed" && result.reason === "not-paid") {
      const cancellation = await cancelPendingPlanPayment({
        payload: input.payload,
        paymentId
      });
      return finishReplay({
        ...input,
        leaseToken: claim.leaseToken,
        status: cancellation.ok ? "processed" : "retryable",
        outcomeCode: cancellation.ok
          ? "plan-payment-failed"
          : cancellation.reason
      });
    }
    if (status === "refunded" && result.reason === "not-paid") {
      return finishReplay({
        ...input,
        leaseToken: claim.leaseToken,
        status: "processed",
        outcomeCode: "plan-payment-refunded"
      });
    }
    return finishReplay({
      ...input,
      leaseToken: claim.leaseToken,
      status: "rejected",
      outcomeCode: result.reason
    });
  }

  const result = await syncProductPayment({
    payload: input.payload,
    paymentId
  });
  return finishReplay({
    ...input,
    leaseToken: claim.leaseToken,
    status: result.ok
      ? "processed"
      : result.reason === "verify-unavailable"
        ? "retryable"
        : "rejected",
    outcomeCode: result.ok ? "product-payment-paid" : result.reason
  });
}
