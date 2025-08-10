import {CollectionConfig} from "payload";
import {
	isAdminOrEditor,
	standardCreateAccess,
} from "../plugins/locker/access/accessCheckers";
import {slugField} from "../fields/slug";
import {AuthorField} from "../fields/AuthorFields/AuthorField";
import {sanitizeAuthor} from "../fields/AuthorFields/hooks";

export const Tags: CollectionConfig = {
	slug: "tags",
	access: {
		read: () => true,
		create: standardCreateAccess,
		update: isAdminOrEditor,
		delete: isAdminOrEditor,
	},
	defaultPopulate: {
		title: true,
		id: true,
		slug: true,
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			unique: true,
			index: true,
			access: {
				read: () => true,
				create: standardCreateAccess,
				update: isAdminOrEditor,
			},
		},

		...AuthorField(false),
		...slugField("title"),
	],
	hooks: {
		beforeChange: [sanitizeAuthor(false)],
	},
};
