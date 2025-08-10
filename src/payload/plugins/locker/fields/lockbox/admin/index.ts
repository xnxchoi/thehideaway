import {CheckboxField, CollectionSlug} from 'payload'

/**
 * Creates admin configuration for lockbox field based on collection type
 * @param props Configuration properties
 * @returns Admin configuration for the lockbox field
 */
export const lockboxFieldAdmin = (props: {
	collection: CollectionSlug
	overrides?: Partial<CheckboxField['admin']>
}): CheckboxField['admin'] => {
	const {collection, overrides = {}} = props

	// Common configuration for all collections


	// Merge with any overrides provided
	return {
		hidden: true,
		...overrides,
	}
}
