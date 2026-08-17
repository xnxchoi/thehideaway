import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import {Surf as SurfType} from "@/payload-types";
import {RichContent} from "@/payload/collections/Posts/richContent";
import {validateSurf} from "@/payload/collections/Surf/hooks/validateSurf";
import {authorFields} from "@/payload/fields/AuthorField/AuthorField";
import {sanitizeAuthor} from "@/payload/fields/AuthorField/hooks";
import {slugField} from "@/payload/fields/slug";
import {surfAccess} from "@/payload/plugins/locker/access";
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser";
import {generatePreviewPathWithAuthor, resolveRelationshipID} from "@/utilities/generatePreviewPath";
import {getServerSideURL} from "@/utilities/getURL";
import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
	PreviewField
} from "@payloadcms/plugin-seo/fields";
import type {CollectionConfig, CollectionSlug, Where} from "payload";
import {RichTitle} from "../Posts/richTitle";
import {getSurfBookMarks} from "./endpoints/getSurfBookmarks";
import {afterDelete} from "./hooks/afterDelete";
import { idField } from "@/payload/fields/IDField";
import { PROPS_COLLAPSIBLE } from "@/constants/navigation";

export const Surfs: CollectionConfig = {
	slug: "surf",
	labels: {
		singular: "Surf",
		plural: "Surfs"
	},
	lockDocuments: false,

	access: surfAccess,
	// This config controls what's populated by default when a post is referenced
	// https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
	// Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'surfs'>
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
				const author = resolveRelationshipID(data?.author) || req.user?.id;
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
		preview: async (doc: Partial<SurfType>, options) => {
			if (!doc) {
				throw new Error("Doc is required to generate preview path");
			}
			const author = resolveRelationshipID(doc.author) || options.req.user?.id;
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
    idField(),
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
				value: "instagram",
				label: "Instagram",
			}, {
				value: "youtube",
				label: "YouTube"
			}, {
				value: "external",
				label: "External Link"
			},{
				value:"medium",
				label:"Medium.com"
			}],
			required: true,
			label: "Source",
			defaultValue: "external",
			admin: {
				hidden: true
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
						const surfs = await req.payload
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
								docs.map((doc) => ({value: doc.id, relationTo: "surf"} satisfies {value:string;relationTo:CollectionSlug}))
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
						return [...surfs, ...posts];
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
			handler: getSurfBookMarks
		}
	],
	hooks: {
		beforeChange: [sanitizeAuthor(false), populatePublishedAt],
		afterChange: [validateSurf,   ],
		afterDelete: [afterDelete,  ]
	},
	versions: {
		drafts: {
			autosave: false,
			schedulePublish: true
		},

		maxPerDoc: 50
	}
};
