import {CollectionConfig, Where} from "payload"
import {
	authenticated,
	isAdmin,
	standardUpdateAccess,
} from "@/payload/plugins/locker/access/accessCheckers"
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField"
import {sanitizeAuthor} from "@/payload/fields/AuthorFields/hooks"
import {populatePublishedAt} from "@/hooks/populatePublishedAt"
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser"
import {slugField} from "@/payload/fields/slug"
import {createCuid} from "@/utilities/stringUtilities"

export const Albums: CollectionConfig = {
	slug: "albums",
	admin: {
		useAsTitle: "title",
		baseListFilter: filterDocByCurrentUser,
		/*
	   components: {
		   views: {
			 edit: {
			   default: {
				 Component: "@/payload/views/Edit/index.tsx#DefaultEditView",
			   },
			 },
		   },
		 },
	 */
	},
	defaultPopulate: {
		title: true,
		cover: true,
		author: true,
		artist: true,
	},
	access: {
		create: authenticated,
		delete: ({req: {user}}) => {
			if (!user) return false
			if (user?.role === "admin") return true
			return {
				author: {
					equals: user.id,
				},
			}
		},
		update: standardUpdateAccess,
		read: ({req: {user}}) => {
			const qr: Where = {
				_status: {
					equals: "published",
				},
			}
			if (user) {
				if (user.role) {
					if (user.role === "admin") return true
					return {
						or: [
							qr,
							{
								author: {
									equals: user.id,
								},
							},
						],
					}
				}
			}
			return qr
		},
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "release_date",
			type: "date",
		},
		{
			name: "cover",
			type: "upload",
			relationTo: "media",
		},
		{
			name: "artist",
			type: "text",
			required: true,
		},
		{
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target",
		},
		{
			name: "tags",
			type: "relationship",
			relationTo: "tags",
			hasMany: true,
			admin: {
				allowCreate: true,
				allowEdit: false,
			},
			access: {
				read: () => true,
			},
			maxDepth: 1,
			maxRows: 5,
			index: true,
		},
		{
			name: "description",
			type: "textarea",
		},
		{
			name: "visibility",
			type: "select",
			required: true,
			options: ["public", "private"],
			defaultValue: "public",
		},
		{
			name: "publishedAt",
			type: "date",
			admin: {
				date: {
					pickerAppearance: "dayAndTime",
				},
			},
		},
		...AuthorField(),


		...slugField("title", {
			checkboxOverrides: {
				admin: {
					readOnly: !isAdmin,
				},
			},
		}),
	],
	versions: {
		drafts: {
			autosave: {
				interval: 3000,
			},
		},
		maxPerDoc: 5,
	},
	hooks: {

		beforeChange: [sanitizeAuthor(false), populatePublishedAt],
	},
}
