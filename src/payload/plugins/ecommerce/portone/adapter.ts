import type { PaymentAdapter } from "@payloadcms/plugin-ecommerce/types";

import { createPortOneConfirmOrder } from "./confirm-order";
import type { PortOneAdapterDeps } from "./deps";
import { createPortOneInitiatePayment } from "./initiate-payment";
import { createPortOneWebhookEndpoint } from "./webhooks";

export function portoneAdapter(deps: PortOneAdapterDeps = {}): PaymentAdapter {
  const confirmOrder = createPortOneConfirmOrder(deps);
  return {
    name: "portone",
    label: "PortOne",
    initiatePayment: createPortOneInitiatePayment(deps),
    confirmOrder,
    endpoints: [createPortOneWebhookEndpoint(deps)],
    group: {
      name: "portone",
      type: "group",
      admin: {
        condition: (data) => data?.paymentMethod === "portone"
      },
      fields: [
        { name: "paymentId", type: "text", index: true },
        { name: "transactionId", type: "text" },
        { name: "channel", type: "text" },
        { name: "method", type: "text" }
      ]
    }
  };
}
