import type { CollectionConfig } from "payload";
import { CommerceProviderEvents } from "@/payload/collections/(consumption)/CommerceProviderEvents";

// Reuse the durable event journal, not its dormant product-payment replay API/FK.
// Plugin settlement resolves transaction_ref; membership/ticket ownership is separate.
export const CheckoutProviderEvents: CollectionConfig = {
  ...CommerceProviderEvents,
  endpoints: [],
  fields: CommerceProviderEvents.fields.filter(
    (field) => !("name" in field && field.name === "product_payment")
  )
};
