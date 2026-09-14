import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { createLostMergeCartEndpoint } from "./merge-cart-endpoint";
import { appendLostLineFields } from "./lost-line-fields";
import { protectCartQuantities } from "./cart-quantities";
import { protectCartOwnership, restrictCartAccess } from "./cart-ownership";
import {
  protectCartMutationReads,
  wrapCartMutationEndpoint
} from "./cart-transaction";

export { CART_LINE_SCHEMA_VERSION } from "./lost-line-fields";

export const cartsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  access: {
    ...defaultCollection.access,
    read: restrictCartAccess(defaultCollection.access?.read),
    update: restrictCartAccess(defaultCollection.access?.update, {
      writable: true
    }),
    delete: restrictCartAccess(defaultCollection.access?.delete, {
      writable: true
    })
  },
  hooks: {
    ...defaultCollection.hooks,
    beforeOperation: [
      protectCartMutationReads,
      ...(defaultCollection.hooks?.beforeOperation ?? [])
    ],
    beforeChange: [
      protectCartOwnership,
      ...(defaultCollection.hooks?.beforeChange ?? []),
      protectCartQuantities
    ]
  },
  endpoints: Array.isArray(defaultCollection.endpoints)
    ? defaultCollection.endpoints.map((endpoint) =>
        "path" in endpoint && endpoint.path === "/:id/merge"
          ? createLostMergeCartEndpoint({
              cartsSlug: defaultCollection.slug ?? "carts"
            })
          : wrapCartMutationEndpoint(endpoint)
      )
    : defaultCollection.endpoints,
  fields: appendLostLineFields(defaultCollection.fields)
});
