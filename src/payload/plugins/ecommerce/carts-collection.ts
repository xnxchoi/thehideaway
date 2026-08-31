import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { createLostMergeCartEndpoint } from "./merge-cart-endpoint";
import { appendLostLineFields } from "./lost-line-fields";

export { CART_LINE_SCHEMA_VERSION } from "./lost-line-fields";

export const cartsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  endpoints: Array.isArray(defaultCollection.endpoints)
    ? defaultCollection.endpoints.map((endpoint) =>
        "path" in endpoint && endpoint.path === "/:id/merge"
          ? createLostMergeCartEndpoint({
              cartsSlug: defaultCollection.slug ?? "carts"
            })
          : endpoint
      )
    : defaultCollection.endpoints,
  fields: appendLostLineFields(defaultCollection.fields)
});
