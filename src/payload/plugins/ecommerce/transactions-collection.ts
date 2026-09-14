import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { appendLostLineFields } from "./lost-line-fields";
import { checkoutTransactionFields } from "./checkout-fields";
import { protectPluginTransaction } from "./transaction-lifecycle";

export const transactionsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection.hooks,
    beforeChange: [
      protectPluginTransaction,
      ...(defaultCollection.hooks?.beforeChange ?? [])
    ]
  },
  fields: [
    ...appendLostLineFields(defaultCollection.fields),
    ...checkoutTransactionFields
  ]
});
