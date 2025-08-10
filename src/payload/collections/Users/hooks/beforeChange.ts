import {User} from "@/payload-types"
import {CollectionBeforeChangeHook} from "payload"
import {sanitizeNameValues} from "@/utilities/sanitizeNameValues"

export const beforeChangeUsers: CollectionBeforeChangeHook<User> = async ({
	req,
	originalDoc,
	data,
	operation,
	context,
}) => {
	if (operation === "update") {
		const {
			firstName: newFirst,
			lastName: newLast,
			name: newFull,
		} = testNames({data, originalDoc, operation})
		data.name = newFull
		data.firstName = newFirst
		data.lastName = newLast

		return data
	}
}
const testNames = ({
	data,

	originalDoc,
}: {
	data: Partial<User>
	operation: "create" | "update"
	originalDoc?: User
}) => {
	const {
		firstName: ogFirst,
		lastName: ogLast,
		name: ogFull,
	} = originalDoc!
	let firstName = ogFirst,
		lastName = ogLast,
		name = ogFull
	if (data.firstName) {
		firstName = sanitizeNameValues(data.firstName)
	}
	if (data.lastName) {
		lastName = sanitizeNameValues(data.lastName)
	}
	name = `${firstName} ${lastName}`
	return {
		firstName,
		lastName,
		name,
	}
}
