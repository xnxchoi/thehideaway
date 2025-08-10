import type {Payload, TaskHandler} from "payload"

/**
 * Idempotently ensure the “uncategorized” doc exists
 */
export const ensureBaseCategory: TaskHandler<'ensureBaseCategory'> = async ({job, req}) => {
	const {docs} = await req.payload.find({
		collection: 'categories',
		overrideAccess: true,
		pagination: false,
		where: {slug: {equals: 'uncategorized'}},
		limit: 1,
	})

	if (docs.length === 0 || !docs[0]) {
		const doc = await req.payload.create({
			collection: 'categories',
			data: {
				title: 'Uncategorized',
				relatedCategories: [],
				description: 'Default bucket for all reflections without a category.',
				slug: 'uncategorized',
				slugLock: true,
			},
		})
		req.payload.logger.info('💾 Created default “Uncategorized” category')
		return {
			output: {
				categoryId: doc.id,
			}
		}
	}
	return {
		output: {
			categoryId: docs[0].id,
		}
	}
}
