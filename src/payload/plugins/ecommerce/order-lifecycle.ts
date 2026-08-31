import type { CollectionBeforeChangeHook } from "payload";

import {
  authorizeCommerceLifecycleRequest,
  protectOrderLifecycle
} from "@/lib/lost-commerce/lifecycle-authorization";
import {
  assertOrderTransition,
  isCommerceOrderState,
  type CommerceOrderState,
  ORDER_STATES
} from "@/lib/lost-commerce/transitions";

export const PLUGIN_ORDER_LIFECYCLE_FIELD = "lifecycle_status";

export function pluginStatusFromLifecycle(
  lifecycle: CommerceOrderState
): "processing" | "completed" | "cancelled" | "refunded" {
  if (lifecycle === "refunded") return "refunded";
  if (lifecycle === "canceled" || lifecycle === "failed") return "cancelled";
  if (lifecycle === "confirmed" || lifecycle === "converted") return "completed";
  return "processing";
}

function lifecycleOf(value: unknown): CommerceOrderState | undefined {
  return isCommerceOrderState(value) ? value : undefined;
}

export const protectPluginOrderLifecycle: CollectionBeforeChangeHook = async (
  args
) => {
  const data = { ...(args.data as Record<string, unknown>) };
  const original = args.originalDoc as Record<string, unknown> | undefined;
  const proxied = {
    ...args,
    data: {
      ...data,
      status: data.lifecycle_status ?? original?.lifecycle_status,
      lines: data.items,
      user: data.customer,
      total_amount: data.amount,
      shipping: data.shippingAddress
    },
    originalDoc: original
      ? {
          ...original,
          status: original.lifecycle_status,
          lines: original.items,
          user: original.customer,
          total_amount: original.amount,
          shipping: original.shippingAddress
        }
      : original
  };
  await protectOrderLifecycle(proxied as never);

  if (args.operation === "update") {
    const from = lifecycleOf(original?.lifecycle_status);
    const to = lifecycleOf(data.lifecycle_status) ?? from;
    if (from && to && from !== to) {
      const user = (
        args.req as { user?: { id?: string; role?: string } | null }
      ).user;
      const actor =
        user?.role === "admin" || user?.role === "cofounder"
          ? { kind: "staff" as const, id: user.id ?? "staff", role: user.role }
          : user?.id
            ? { kind: "customer" as const, id: user.id }
            : { kind: "system" as const, id: "portone" };
      assertOrderTransition({ from, to, actor });
    }
  }

  const nextLifecycle = lifecycleOf(data.lifecycle_status);
  if (nextLifecycle) {
    data.status = pluginStatusFromLifecycle(nextLifecycle);
  }
  return data;
};

export function authorizePluginOrderWrite(req: object): void {
  authorizeCommerceLifecycleRequest(req);
}

export const pluginOrderLifecycleOptions = [...ORDER_STATES];
