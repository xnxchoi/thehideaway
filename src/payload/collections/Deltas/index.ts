import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField,
} from "@payloadcms/plugin-seo/fields"
import type {CollectionConfig} from "payload"

import {slugField} from "@/payload/fields/slug"
import {getServerSideURL} from "@/utilities/getURL"

import {
	generatePreviewPathWithAuthor
} from "../../../utilities/generatePreviewPath"
import {sanitizeAuthor} from "@/payload/fields/AuthorFields/hooks"
import {validateDelta} from "@/payload/collections/Deltas/hooks/validateDelta"
import {deltasAccess} from "@/payload/plugins/locker/access"
import {populatePublishedAt} from "@/hooks/populatePublishedAt"
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField"
import {getDeltaBookMarks} from "./endpoints/getDeltaBookmarks"
import {afterDelete} from "./hooks/afterDelete"
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser"
import type {Delta as DeltaType} from "@/payload-types"
import {defaultLexical} from "@/payload/Lexical/defaultLexical"
import {createCuid} from "@/utilities/stringUtilities"

export const Deltas: CollectionConfig = {
	slug: "delta",
	labels: {
		singular: "Delta",
		plural: "Deltas",
	},
	access: deltasAccess,
	// This config controls what's populated by default when a post is referenced
	// https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
	// Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'deltas'>
	defaultPopulate: {
		title: true,
		slug: true,
		category: true,
		meta: {
			image: true,
			description: true,
		},
		_status: true,
	},
	admin: {
		baseListFilter: filterDocByCurrentUser,
		defaultColumns: ["title", "slug", "updatedAt"],
		livePreview: {
			url: async ({data, req}) => {
				const author = (data?.author as string | undefined) || req.user?.id
				if (!author) {
					throw new Error("Author is required to generate preview path")
				}
				const path = await generatePreviewPathWithAuthor({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "delta",
					req,
					userID: author,
				})

				return `${getServerSideURL()}${path}`
			},
		},
		preview: async (doc: Partial<DeltaType>, options) => {
			if (!doc) {
				throw new Error("Doc is required to generate preview path")
			}
			const author = (doc.author as string | undefined) || options.req.user?.id
			if (!author) {
				throw new Error("Author is required to generate preview path")
			}
			const path = await generatePreviewPathWithAuthor({
				slug: typeof doc?.slug === "string" ? doc.slug : "",
				collection: "delta",
				req: options.req,
				userID: author,
			})

			return `${getServerSideURL()}${path}`
		},
		useAsTitle: "title",
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
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},

		{
			type: "tabs",
			admin: {},
			tabs: [
				{
					fields: [
						{
							name: "source",
							type: "text",
							required: true,
							label: "Source",
							admin: {
								description: "Provide the source of the delta spot.",
							},
							index: true,
						},
						{
							name: "content",
							type: "richText",
							editor: defaultLexical,
							label: false,
							required: true,
						},
					],
					label: "Content",
				},
				{
					fields: [
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
							name: "relatedDeltas",
							type: "relationship",
							admin: {},
							label: "Related Deltas",
							filterOptions: ({id}) => {
								return {
									id: {
										not_in: [id],
									},
								}
							},
							hasMany: true,
							defaultValue: async ({user, req}) => {
								const deltas = await req.payload.find({
									collection: "search",
									where: {
										or: []
									},
									select: {
										doc: true,
									},
									pagination: false,
								}).then((res) => res.docs).then((docs) =>
									docs.map((doc) => ({value: doc.id, relationTo: "delta"})),
								).catch((err) => {
									console.error(err)
									return []
								})
								const posts = await req.payload.find({
									collection: "posts",
									where: {
										_status: {
											equals: "published",
										},
									},
									depth: 1,
								}).then((res) => res.docs).then((docs) =>
									docs.map((doc) => ({value: doc.id, relationTo: "posts"})),
								).catch((err) => {
									console.error(err)
									return []
								})
								return [...deltas, ...posts]
							},
							relationTo: ["delta", "posts"],
							maxDepth: 1,
						},
						{
							name: "category",
							type: "relationship",
							admin: {

								allowCreate: false,
								allowEdit: false,
							},
							hasMany: false,
							relationTo: "categories",
							maxDepth: 1,
							defaultValue: async ({user, req}) => {
								return await req.payload.find({
									collection: "categories",
									where: {
										slug: {
											equals: "uncategorized",
										},
									},
									depth: 1,
									limit: 1,
								}).then((res) => res.docs).then((docs) =>
									docs[0]?.id ?? null
								).catch((err) => {
									console.error(err)
									return null
								})
							},
						},

					],
					label: "Meta",
				},
				{
					name: "meta",
					label: "SEO",
					fields: [
						OverviewField({
							titlePath: "meta.title",
							descriptionPath: "meta.description",
							imagePath: "meta.image",
						}),
						MetaTitleField({
							hasGenerateFn: true,
						}),
						MetaImageField({
							relationTo: "media",
						}),

						MetaDescriptionField({}),
						PreviewField({
							// if the `generateUrl` function is configured
							hasGenerateFn: true,

							// field paths to match the target field for data
							titlePath: "meta.title",
							descriptionPath: "meta.description",
						}),
					],
				},
			],
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
		{
			admin: {
				allowCreate: false,

				condition: ({ctx}) => ctx?.user?.role === 'admin'
			},
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target",
		},
		...AuthorField(),
		...slugField(),
	],
	endpoints: [
		{
			path: "/:id/bookmarks",
			method: "get",
			handler: getDeltaBookMarks,
		},
	],
	hooks: {

		beforeChange: [sanitizeAuthor(false), populatePublishedAt],
		afterChange: [validateDelta],
		afterDelete: [afterDelete],
	},
	versions: {
		drafts: {
			autosave: false,
			schedulePublish: true,
		},

		maxPerDoc: 50,
	},
}
