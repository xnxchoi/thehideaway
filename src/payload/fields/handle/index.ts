import type {FieldAccess, TextField} from "payload";
import {formatUserHandleHook} from "@/payload/fields/handle/formatUserHandle";
import {User} from "@/payload-types";

type Overrides = {
	userHandleOverrides?: Partial<TextField>;
};

type UserHandle = (overrides?: Overrides) => [TextField];

export const userHandleField: UserHandle = (overrides = {}) => {
	const {userHandleOverrides} = overrides;

	// Expect ts error here because of typescript mismatching Partial<TextField> with TextField
	// @ts-expect-error
	const userHandleField: TextField = {
		name: "slug",
		unique: true,
		required: true,
		type: "text",
		index: true,
		access: {
			update: ({data, req, id, doc}: Parameters<FieldAccess<User>>[0]) => {
				const docId = id || doc?.id || data?.id;
				if (req.context.overrideAccess === true) return true;
				if (req.user?.role === "admin") return true;
				if (!docId) return false;
				if (req.user && req.user.id === docId) return true;
				return false;
			},
		},

		saveToJWT: true,
		...(userHandleOverrides || {}),
		hooks: {
			// Kept this in for hook or API based updates
			beforeValidate: [formatUserHandleHook],
		},
		admin: {
			...(userHandleOverrides?.admin || {}),
			components: {
				Field: {
					path: "@/payload/fields/handle/ServerHandle.tsx",
				},
			},
		},
	};

	return [userHandleField];
};
