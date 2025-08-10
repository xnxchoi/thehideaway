import {CollectionConfig, CollectionSlug} from "payload"
import {createValidQueryStringRegex} from "../../../utilities/regexUtilities"

export const validTypes: CollectionSlug[] = [
	"posts",
	"delta",
	"profile",

	"users",
	"albums",
	"playlists",
	"profile",
	"tracks",
	"userMedia",
]
export const bookmarkTypesRegex = createValidQueryStringRegex(validTypes)
export const Bookmarks: CollectionConfig = {
	slug: "bookmarks",
	admin: {
		useAsTitle: "id",
		hidden: true,
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
	access: {
		read: ({req}) => {
			return true
		},
	},
	fields: [
		{
			name: "user",
			type: "relationship",
			relationTo: "users",
			hasMany: false,
			required: true,
			maxDepth: 0,
			index: true,
			access: {
				read: () => true,
				create: () => true,
				update: () => false,
			},
		},
		{
			name: "target",
			type: "relationship",
			relationTo: [...validTypes],
			required: true,
			hasMany: false,
			index: true,
			maxDepth: 0,
			access: {
				read: () => true,
				create: () => true,
				update: () => false,
			},
		},
	],
	hooks: {
		beforeChange: [
			async ({data, req, operation, originalDoc}) => {
				if (!req.user) {
					return
				}
				if (operation === "create") {
					const bookmarkExists = await req.payload.count({
						collection: "bookmarks",
						where: {
							and: [
								{
									"target.relationTo": {
										equals: data.target.relationTo,
									},
								},
								{
									"target.value": {
										equals: data.target.value,
									},
								},
								{
									user: {
										equals: data.user,
									},
								},
							],
						},
					}).then((count) => {
						return count.totalDocs > 0
					}).catch((err) => {
						console.error(err)
						return false
					})
					if (!bookmarkExists) {
						return data
					}
				}
				if (operation === "update") {
					return originalDoc
				}
			},
		],
	},
}