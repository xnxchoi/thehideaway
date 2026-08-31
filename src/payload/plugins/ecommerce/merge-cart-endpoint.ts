import type { CollectionSlug, Endpoint } from "payload";

import { cartLinesMatch } from "./cart-item-matcher";
import { mergeCartEndpoint as createPluginMergeCartEndpoint } from "../../../../node_modules/@payloadcms/plugin-ecommerce/dist/collections/carts/endpoints/mergeCart.js";

// WHY-OVERRIDE-PAYLOAD: plugin 3.88.0 createCartsCollection constructs
// mergeCartEndpoint without cartItemMatcher, and package exports do not
// expose that factory. Merge compares two CartItemData rows, so the
// matcher must accept populated product/variant objects on both sides.

export function createLostMergeCartEndpoint(args: {
  cartsSlug: string;
}): Endpoint {
  return createPluginMergeCartEndpoint({
    cartItemMatcher: ({ existingItem, newItem }) =>
      cartLinesMatch(existingItem, newItem),
    cartsSlug: args.cartsSlug as CollectionSlug
  });
}
