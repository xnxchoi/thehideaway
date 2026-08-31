import type { CollectionOverride } from "@payloadcms/plugin-ecommerce/types";

import { appendLostLineFields } from "./lost-line-fields";

export const transactionsCollectionOverride: CollectionOverride = ({
  defaultCollection
}) => ({
  ...defaultCollection,
  fields: appendLostLineFields(defaultCollection.fields)
});
