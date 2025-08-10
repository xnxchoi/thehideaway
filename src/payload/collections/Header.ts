import type {GlobalConfig} from "payload";

import {link} from "@/payload/fields/link";

import {revalidateHeader} from "@components/Header/hooks/revalidateHeader";
import {useConfig} from "@payloadcms/ui";

export const Header: GlobalConfig = {
	slug: "header",
	access: {
		read: () => true,
	},
	admin: {
		hidden: ({user}) => {
			if (!user) return true;

			return !(user?.role === "admin");
		},
	},
	fields: [
		{
			name: "radio",
			type: "relationship",
			relationTo: "playlists",
			hasMany: false,
		},
		{
			name: "navItems",
			type: "array",
			required: true,
			fields: [
				link({
					appearances: ["default"],
					overrides: {
						required: false,
					},
				}),
				{
					name: "previewMedia",
					type: "group",
					fields: [
						{
							name: "desktop",
							type: "relationship",
							relationTo: "media",
							required: false,
							hasMany: false,
						},
						{
							name: "mobile",
							type: "relationship",
							relationTo: "media",
							required: false,
							hasMany: false,
						},
					],
				},
			],
			maxRows: 6,
		},
	],
	hooks: {
		afterChange: [revalidateHeader],
	},
};
