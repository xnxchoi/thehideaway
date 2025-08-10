import {CollectionSlug, RadioField} from 'payload'
import {
	createPagesRadioFieldAccess,
	createStdRadioFieldAccess,
	updatePagesRadioFieldAccess,
	updateStdRadioFieldAccess,
} from '../../access'

export const authorityFieldAccess = (props: {
	collection: CollectionSlug
	overrides?: Partial<RadioField['access']>
}): RadioField['access'] => {
	const {collection, overrides} = props
	const access: RadioField['access'] = {
		read: () => true,
	}
	if (collection === 'pages') {
		access.update = updatePagesRadioFieldAccess
		access.create = createPagesRadioFieldAccess
	} else {
		access.update = updateStdRadioFieldAccess
		access.create = createStdRadioFieldAccess
	}
	return {
		...access,
		...overrides,
	}
}
