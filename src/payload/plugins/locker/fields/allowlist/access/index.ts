import {CollectionSlug, PolymorphicRelationshipField} from 'payload'
import {
	createPagesRelFieldAcess,
	createStdRelFieldAccess,
	updatePagesRelFieldAcess,
	updateStdRelFieldAccess,
} from '../../access'

export const allowListFieldAccess = (props: {
	collection: CollectionSlug
	overrides?: Partial<PolymorphicRelationshipField['access']>
}): PolymorphicRelationshipField['access'] => {
	const {collection, overrides} = props
	const access: PolymorphicRelationshipField['access'] = {
		read: () => true,
	}
	if (collection === 'pages') {
		access.update = updatePagesRelFieldAcess
		access.create = createPagesRelFieldAcess
	} else {
		access.update = updateStdRelFieldAccess
		access.create = createStdRelFieldAccess
	}
	return {
		...access,
		...overrides,
	}
}
