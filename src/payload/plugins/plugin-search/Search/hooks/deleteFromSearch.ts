import {CollectionSlug} from "payload";
import type {DeleteFromSearch} from "../../types"

export const deleteFromSearch: DeleteFromSearch =
	(pluginConfig) =>
		async ({id, collection, req: {payload}, req}) => {
			const searchSlug = (pluginConfig?.searchOverrides?.slug || "search") as CollectionSlug

			try {
				await payload.delete({
					collection: searchSlug,
					depth: 0,
					req,
					where: {
						"doc.relationTo": {
							equals: collection.slug,
						},
						"doc.value": {
							equals: id,
						},
					},
				})
			} catch (err: unknown) {
				payload.logger.error({
					err,
					msg: `Error deleting ${searchSlug} doc.`,
				})
			}
		}
