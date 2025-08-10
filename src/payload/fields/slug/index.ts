import type {CheckboxField, TextField} from "payload";
import {formatSlugHook} from "./formatSlug";

type Overrides = {
	slugOverrides?: Partial<TextField>;
	checkboxOverrides?: Partial<CheckboxField>;
};

type Slug = (
	fieldToUse?: string,
	overrides?: Overrides,
) => [TextField, CheckboxField];

export const slugField: Slug = (fieldToUse = "title", overrides = {}) => {
	const {slugOverrides, checkboxOverrides} = overrides;

	const checkBoxField: CheckboxField = {
		name: "slugLock",
		type: "checkbox",
		defaultValue: true,
		admin: {
			hidden: true,
			position: "sidebar",
		},
		...checkboxOverrides,
	};

	// Expect ts error here because of typescript mismatching Partial<TextField> with TextField
	// @ts-expect-error
	const slugField: TextField = {
		name: "slug",
		type: "text",
		index: true,
		label: "Slug",

		...(slugOverrides || {}),
		hooks: {
			afterRead: [
				({value}) => {
					return decodeURIComponent(value);
				},
			],
			// Kept this in for hook or API based updates
			beforeValidate: [formatSlugHook(fieldToUse)],
			beforeChange: [
				({value, operation, data, originalDoc}): string => {
					const id = data?.id || originalDoc?.id;
					if (!id) {
						return encodeURIComponent(value);
					}
					if (operation === "create") {
						return encodeURIComponent(value + "-" + id);
					}
					if (operation === "update") {
						if (value.includes(id)) {
							return encodeURIComponent(value);
						} else {
							const val = value.includes("-") ? value.split("-")[0]! : value;
							return encodeURIComponent(val + "-" + id);
						}
					}
					return encodeURIComponent(value);
				},
			],
		},
		admin: {
			position: "sidebar",
			...(slugOverrides?.admin || {}),
			components: {
				Field: {
					path: "@/payload/fields/slug/SlugComponent.tsx#SlugComponent",
					clientProps: {
						fieldToUse,
						checkboxFieldPath: checkBoxField.name,
					},
				},
			},
		},
	};

	return [slugField, checkBoxField];
};
