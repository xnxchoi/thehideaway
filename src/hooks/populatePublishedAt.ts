import type {CollectionBeforeChangeHook} from 'payload'

export const populatePublishedAt: CollectionBeforeChangeHook = ({data, operation, req}) => {
	if (operation === 'create' || operation === 'update') {
		if (data._status === 'published') {
			if (!data.publishedAt) {
				data.publishedAt = new Date()
			}
		}
	}
	return data
}