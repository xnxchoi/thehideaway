// ensure there is always a role
// do not let non-admins change role
import type {User} from "@/payload-types";
import {FieldHook} from "payload";
import {Role} from "@/payload/plugins/locker/fields/authority/utils";

export const protectRoles: FieldHook<User> = ({
	data,
	value,
	req: {user},
	operation,
	originalDoc,
	overrideAccess,
	previousValue,
}) => {
	const validRoles: Role[] = ["user", "editor", "author", "patron", "admin"];

	if (operation === "create") {
		if (value && value.length > 0) {
			if (user?.role === "admin" || overrideAccess) {
				return validRoles.includes(value) ? value : "user";
			} else {
				return "user";
			}
		} else {
			return "user";
		}
	}
	const prSet = validRoles.includes(previousValue) ? previousValue : "user";

	if (user?.role === "admin" || overrideAccess) {
		if (validRoles.includes(value)) return value;
	}

	return prSet;
};
