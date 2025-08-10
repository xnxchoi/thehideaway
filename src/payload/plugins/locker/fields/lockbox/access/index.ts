import {Access, CollectionSlug, CheckboxField} from 'payload'
import {
	createPagesCheckboxFieldAcess,
	createStdCheckboxFieldAccess,
	updatePagesCheckboxFieldAcess,
} from '../../access'
import {updateStdCheckboxFieldAccess} from '../../access'

export const lockboxFieldAccess = (args: {
	collection: CollectionSlug
	overrides?: Partial<CheckboxField['access']>
}): CheckboxField['access'] => {
	const {collection, overrides = {}} = args
	const access: CheckboxField['access'] = {
		read: () => true,
	}
	if (collection === 'pages') {
		access.update = updatePagesCheckboxFieldAcess
		access.create = createPagesCheckboxFieldAcess
	} else {
		access.update = updateStdCheckboxFieldAccess
		access.create = createStdCheckboxFieldAccess
	}
	return {
		...access,
		...overrides,
	}
}
