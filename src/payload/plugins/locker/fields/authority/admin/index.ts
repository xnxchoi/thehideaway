import {CollectionSlug, Condition, NumberField} from "payload"

/**
 * Field admins condition for locked checkbox
 *
 */
const pagesCondition: Condition = (data, siblingData, {user}) => {
	if (!user) return false
	if (user?.role === "admin") return true
	return false
}
const defaultCondition: Condition = (data, siblingData, {user}) => {
	if (!user || !user.role) return false
	if (["admin", "editor"].includes(user?.role)) return true
	if (user?.role === "author") {
		if (Array.isArray(data?.author)) {
			return (
				data?.author.length > 0 && data?.author.some((au) => au === user?.id)
			)
		} else if (data?.author === user?.id) {
			return true
		}
	}
	return false
}
export const authorityFieldAdmin = (props: {
	collection: CollectionSlug
	overrides?: Partial<NumberField["admin"]>
}): NumberField["admin"] => {
	const {collection, overrides = {}} = props
	return collection === "pages"
		? {
			position: "sidebar",
			hidden: true, // components: {
			//   Field: {
			//     path: '@/plugins/locker/fields/authority/component',
			//     clientProps:{
			//       path:'authority'
			//     }
			//   },
			// },
		}
		: {
			hidden: true,
			position: "sidebar",
			...overrides,
		}
}
