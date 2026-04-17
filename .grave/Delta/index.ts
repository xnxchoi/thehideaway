import {populatePublishedAt} from "../../src/hooks/populatePublishedAt";
import type {Surf as DeltaType} from "../../src/payload-types";
import {
	updateCategoryAfterChange,
	updateCategoryAfterDelete
} from "../../src/payload/collections/Categories/hooks";
import {validateDelta} from "./hooks/validateDelta";
import {RichContent} from "../../src/payload/collections/Posts/richContent";
import {authorFields} from "../../src/payload/fields/AuthorField/AuthorField";
import {sanitizeAuthor} from "../../src/payload/fields/AuthorField/hooks";

import {slugField} from "../../src/payload/fields/slug";
import {surfAccess} from "../../src/payload/plugins/locker/access";
import {filterDocByCurrentUser} from "../../src/payload/utilities/filterDocByCurrentUser";
import {getServerSideURL} from "../../src/utilities/getURL";
import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField
} from "@payloadcms/plugin-seo/fields";
import type {CollectionConfig, Where} from "payload";
import {generatePreviewPathWithAuthor} from "../../src/utilities/generatePreviewPath";
import {PROPS_COLLAPSIBLE} from "../../src/payload/collections/constants";
import {RichTitle} from "../../src/payload/collections/Posts/richTitle";
import {getDeltaBookMarks} from "./endpoints/getDeltaBookmarks";
import {afterDelete} from "./hooks/afterDelete";

export const Surfs: CollectionConfig = {
	slug: "surf",
	labels: {
		singular: "Surf",
		plural: "Surf"
	},
	lockDocuments: false,

	access: surfAccess ,
	// This config controls what's populated by default when a post is referenced
	// https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
	// Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'deltas'>
	defaultPopulate: {
		title: true,
		slug: true,
		category: true,
		meta: {
			image: true,
			description: true
		},
		_status: true
	},
	admin: {
		baseFilter: filterDocByCurrentUser,
		defaultColumns: ["title", "slug", "updatedAt"],
		livePreview: {
			url: async ({data, req}) => {
				const author = (data?.author as string | undefined) || req.user?.id;
				if (!author) {
					throw new Error("Author is required to generate preview path");
				}
				const path = await generatePreviewPathWithAuthor({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "surf",
					req,
					userID: author
				});

				return `${getServerSideURL()}${path}`;
			}
		},
		preview: async (doc: Partial<DeltaType>, options) => {
			if (!doc) {
				throw new Error("Doc is required to generate preview path");
			}
			const author = (doc.author as string | undefined) || options.req.user?.id;
			if (!author) {
				throw new Error("Author is required to generate preview path");
			}
			const path = await generatePreviewPathWithAuthor({
				slug: typeof doc?.slug === "string" ? doc.slug : "",
				collection: "surf",
				req: options.req,
				userID: author
			});

			return `${getServerSideURL()}${path}`;
		},
		useAsTitle: "title",
		components: {
			views: {
				edit: {
					default: {
						Component: "@/payload/views/Edit/index.tsx#EditView"
					}
				}
			}
		}
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
			admin: {
				hidden: true
			}
		},
		RichTitle(),

		{
			name: "source",
			type: "select",
			options: [{
				value: "x",
				label: "X"
			}, {
				value: "twitter",
				label: "Twitter"
			}, {
				value: "substack",
				label: "Substack",
			}, {
				value: "Instagram",
				label: "instagram"
			}, {
				value: "youtube",
				label: "YouTube"
			}],
			required: true,
			label: "Source",
			admin: {
				description: "Provide the source of the delta spot."
			},
			index: true
		},
		RichContent(),
		{
			label: PROPS_COLLAPSIBLE,
			type: "collapsible",
			admin: {
				position: "sidebar"
			},
			fields: [
				{
					name: "category",
					type: "relationship",
					admin: {
						position: "sidebar",
						allowCreate: false,
						allowEdit: false
					},
					hasMany: false,
					required: true,
					relationTo: "categories",
					maxDepth: 1,
					defaultValue: async ({user, req}) => {
						return await req.payload
							.find({
								collection: "categories",
								where: {
									slug: {
										equals: "uncategorized"
									}
								},
								depth: 1,
								limit: 1
							})
							.then((res) => res.docs)
							.then((docs) => docs[0])
							.catch((err) => {
								console.error(err);
								return null;
							});
					}
				},
				...slugField(),
				{
					name: "publishedAt",
					type: "date",
					admin: {
						date: {
							pickerAppearance: "dayAndTime"
						}
					}
				}
			]
		},
		{
			label: "Meta",
			type: "collapsible",
			admin: {position: "sidebar"},
			fields: [
				...authorFields(false),
				{
					name: "tagged",
					label: "Tags",
					type: "relationship",
					relationTo: "tags",
					hasMany: true,

					admin: {
						allowCreate: true,
						allowEdit: false
					},
					access: {
						read: () => true
					},
					maxDepth: 1,
					maxRows: 5,
					index: true
				},
				{
					name: "relatedSurfs",
					type: "relationship",

					label: "Related",
					filterOptions: ({id}) => {
						return {
							id: {
								not_in: [id]
							}
						};
					},
					hasMany: true,
					defaultValue: async ({user, req}) => {
						const where = {
							and: [
								{
									_status: {
										equals: "published"
									}
								},
								{
									author: {
										equals: user?.id
									}
								}
							]
						} as Where;
						const deltas = await req.payload
							.find({
								collection: "surf",
								where,
								select: {
									title: true
								},
								pagination: false
							})
							.then((res) => res.docs)
							.then((docs) =>
								docs.map((doc) => ({value: doc.id, relationTo: "surf"}))
							)
							.catch((err) => {
								console.error(err);
								return [];
							});
						const posts = await req.payload
							.find({
								collection: "posts",
								where,
								select: {
									title: true
								}
							})
							.then((res) => res.docs)
							.then((docs) =>
								docs.map((doc) => ({value: doc.id, relationTo: "posts"}))
							)
							.catch((err) => {
								console.error(err);
								return [];
							});
						return [...deltas, ...posts];
					},
					relationTo: ["surf", "posts"],
					maxDepth: 1
				}
			]
		},

		{
			label: "SEO",
			type: "collapsible",
			admin: {position: "sidebar"},
			fields: [
				{
					name: "meta",
					type: "group",
					label: "SEO",

					fields: [
						OverviewField({
							titlePath: "meta.title",
							descriptionPath: "meta.description",
							imagePath: "meta.image",
						}),
						MetaTitleField({
							hasGenerateFn: true,
							overrides: {
								required: true,
								defaultValue: () => "",

							}
						}),
						MetaImageField({
							relationTo: "media"
						}),

						MetaDescriptionField({}),
						PreviewField({
							// if the `generateUrl` function is configured
							hasGenerateFn: true,

							// field paths to match the target field for data
							titlePath: "meta.title",
							descriptionPath: "meta.description"
						})
					]
				}
			]
		},

		{
			admin: {
				hidden: true
			},
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target"
		}
	],
	endpoints: [
		{
			path: "/:id/bookmarks",
			method: "get",
			handler: getDeltaBookMarks
		}
	],
	hooks: {
		beforeChange: [sanitizeAuthor(false), populatePublishedAt],
		afterChange: [validateDelta, updateCategoryAfterChange,],
		afterDelete: [afterDelete, updateCategoryAfterDelete]
	},
	versions: {
		drafts: {
			autosave: false,
			schedulePublish: true
		},

		maxPerDoc: 50
	}
};
