import {CollectionConfig, Where} from "payload"
import {
	authenticated,
	isAdmin,
	standardUpdateAccess,
} from "@/payload/plugins/locker/access/accessCheckers"
import {populatePublishedAt} from "@/hooks/populatePublishedAt"
import {sanitizeAuthor} from "../../fields/AuthorFields/hooks"
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField"
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser"
import {slugField} from "@/payload/fields/slug"
import {createCuid} from "@/utilities/stringUtilities"

export const Playlists: CollectionConfig = {
	slug: "playlists",
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
		author: true,
		tracks: true,
		visibility: true,
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
				and: [
					{
						_status: {
							equals: "published",
						},
					},
					{
						visibility: {
							equals: "public",
						},
					},
				],
			}
			if (user) {
				if (user.role) {
					if (user?.role === "admin") return true
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
			name: "cover",
			type: "upload",
			relationTo: "userMedia",
			filterOptions: ({data, siblingData, req, user}) => {
				if (!user) return false
				return {
					and: [
						{
							mimeType: {
								like: "image/%",
							},
						},
						{
							or: [
								{
									author: {
										equals: user.id,
									},
								},

								{
									_status: {
										equals: "published",
									},
								},
							],
						},
					],
				} as Where
			},
		},
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "description",
			type: "textarea",
		},
		{
			name: "tracks",
			type: "relationship",
			relationTo: "tracks",
			hasMany: true,
			maxDepth: 1,
			filterOptions: ({data, siblingData, req, user}) => {
				if (!user) return false
				return {
					or: [
						{
							author: {
								equals: user.id,
							},
						},
						{
							and: [
								{
									visibility: {
										equals: "public",
									},
								},
								{
									_status: {
										equals: "published",
									},
								},
							],
						},
					],
				} as Where
			},
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
		...AuthorField(true),
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
		},
		...slugField("title", {
			checkboxOverrides: {
				admin: {
					readOnly: !isAdmin,
				},
			},
		}),
	],
	hooks: {

		beforeChange: [sanitizeAuthor(true), populatePublishedAt],
	},
	versions: {
		drafts: {
			autosave: false,
		},
		maxPerDoc: 10,
	},
}
