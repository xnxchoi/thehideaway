import {Field, type TextField} from "payload";

interface ColorFieldOptions {
	name?: string;
	label?: string;
	overrides?: {
		defaultValue?: string;
		access?: TextField["access"];
	};
}

export const createColorField = ({
	name = "color",
	label = "Color",
	overrides,
}: ColorFieldOptions): Field => ({
	name,
	type: "text",
	label,
	defaultValue: "#FC8D8DFF",
	admin: {
		components: {
			Field:
				"@/payload/fields/ColorPicker/CustomTailwindColor.tsx#SelectColorFont",
		},
	},
	...overrides,
	access: {
		read: () => true,
		update: () => true,
		create: () => true,
		...overrides?.access,
	},
});
export const createBackgroundColorField = ({
	name = "backgroundColor",
	label = "Color",
}: ColorFieldOptions): Field => ({
	name,
	type: "text",
	label,
	defaultValue: "#F3FAFCFF",
	admin: {
		components: {
			Field:
				"@/payload/fields/ColorPicker/CustomTailwindColor.tsx#SelectColorBackground",
		},
	},
});
