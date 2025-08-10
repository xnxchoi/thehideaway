import {
	AccessArgs,
	CollectionConfig,
	headersWithCors,
	PayloadRequest,
	type TextFieldSingleValidation,
	Where,
} from "payload";

import {
	BlocksFeature,
	FixedToolbarFeature,
	HeadingFeature,
	HorizontalRuleFeature,
	InlineToolbarFeature,
	lexicalEditor,
	LinkFeature,
	type LinkFields,
} from "@payloadcms/richtext-lexical";
import {Banner} from "@/payload/blocks/Banner/config";
import {Code} from "@/payload/blocks/Code/config";
import {MediaBlock} from "@/payload/blocks/MediaBlock/config";
import {
	generatePreviewPath,
	generatePreviewPathWithAuthor,
} from "@/utilities/generatePreviewPath";
import {sanitizeAuthor} from "../../fields/AuthorFields/hooks";
import {revalidateDelete, revalidatePost} from "./hooks/revalidatePost";

import {
	MetaImageField,
	MetaTitleField,
	OverviewField,
} from "@payloadcms/plugin-seo/fields";
import {slugField} from "@/payload/fields/slug";
import {Post} from "@/payload-types";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {getPostHandler} from "./api/getPostHandler";
import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField";
import {postBookmarksHandler} from "./api/postBookmarksHandler";
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser";
import {createCuid} from "@/utilities/stringUtilities";
import {
	postBookmarkSaveHandler,
	unBookmarkPostHandler,
} from "./api/bookmarkPostHandler";

export const Posts: CollectionConfig<"posts"> = {
	slug: "posts", // This config controls what's populated by default when a post is referenced
	// https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
	// Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
	access: {
		create: ({req: {user}}) => {
			if (!user || !user.role) return false;
			if (user.role === "admin") return true;
			if (user.role === "editor") return true;
			if (user.role === "author") return true;

			return false;
		},
		update: ({req: {user}}) => {
			if (user?.role === "admin") return true;
			if (user?.role === "editor") return true;
			return {
				author: {
					equals: user?.id,
				},
			};
		},
		delete: ({req: {user}}) => {
			if (!user || !user.role) return false;
			if (user.role === "admin") return true;
			if (user.role === "editor") return true;
			return {
				author: {
					equals: user.id,
				},
			};
		},
		read: async (args: AccessArgs) => {
			const {req} = args;
			const {user} = req;
			if (!user || !user.role) {
				return {
					_status: {
						equals: "published",
					},
				} as Where;
			}
			if (user.role === "admin") return true;
			if (user.role === "editor") {
				return true;
			}
			return {
				or: [
					{
						author: {
							equals: user?.id,
						},
					},
					{
						_status: {
							equals: "published",
						},
					},
				],
			};
		},
	},
	defaultPopulate: {
		title: true,
		subtitle: true,
		author: true,
		locked: true,
		image: true,
		meta: {
			image: true,
		},
		slug: true,
		category: true,
	},
	admin: {
		defaultColumns: ["title", "slug", "updatedAt"],
		baseListFilter: filterDocByCurrentUser,
		livePreview: {
			url: async ({
				data,
				req,
			}: {
				data: Partial<Post>;
				req: PayloadRequest;
			}) => {
				if (!data) {
					throw new Error("Data is required to generate preview path");
				}
				const currentUser = req.user;
				if (!currentUser) {
					throw new Error("You must be logged in to generate a preview path");
				}
				const author = (data?.author as string | undefined) || currentUser?.id;
				if (!author) {
					throw new Error("Author is required to generate preview path");
				}
				const path = await generatePreviewPathWithAuthor({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "posts",
					req,
					userID: author,
				});

				return path;
			},
		},
		preview: (data, {req}) =>
			generatePreviewPath({
				slug: typeof data?.slug === "string" ? data.slug : "",
				collection: "posts",
				req,
			}),
		useAsTitle: "title",
	},
	fields: [
		{
			type: "tabs",

			tabs: [
				{
					fields: [
						{
							name: "id",
							type: "text",
							required: true,
							defaultValue: () => createCuid(),
							admin: {
								hidden: true,
							},
							access: {
								read: () => true,
								create: () => false,
								update: () => false,
							},
						},

						{
							name: "title",
							type: "text",
							label: "Title",
							required: true,
							admin: {},
						},

						{
							name: "content",
							type: "richText",
							editor: lexicalEditor({
								features: ({rootFeatures}) => {
									return [
										...rootFeatures,
										HeadingFeature({
											enabledHeadingSizes: ["h1", "h2", "h3", "h4"],
										}),
										BlocksFeature({blocks: [Banner, Code, MediaBlock]}),
										FixedToolbarFeature(),
										InlineToolbarFeature(),
										HorizontalRuleFeature(),
										LinkFeature({
											enabledCollections: ["pages", "posts", "delta"],
											fields: ({defaultFields}) => {
												const defaultFieldsWithoutUrl = defaultFields.filter(
													(field) => {
														if ("name" in field && field.name === "url")
															return false;
														return true;
													},
												);

												return [
													...defaultFieldsWithoutUrl,
													{
														name: "url",
														type: "text",
														admin: {
															condition: (_data, siblingData) =>
																siblingData?.linkType !== "internal",
														},
														label: ({t}) => t("fields:enterURL"),
														required: true,
														validate: ((value, options) => {
															if (
																(options?.siblingData as LinkFields)?.linkType === "internal"
															) {
																return true; // no validation needed, as no url should exist for internal links
															}
															return value ? true : "URL is required";
														}) as TextFieldSingleValidation,
													},
												];
											},
										}),
									];
								},
							}),
							hooks: {
								// beforeChange: [
								//   ({
								//     data,
								//     value,
								//     req,
								//   }: FieldHookArgs<Post, Post["content"]>) => {
								//     const r = value as SerializedEditorState;
								//     const childrenNodes = r.root.children;
								//     const targetTypes: DefaultNodeTypes["type"][] = [
								//       "text",
								//       "quote",
								//       "heading",
								//       "paragraph",
								//       "link",
								//       "autolink",
								//     ];
								//     const walkNodes = <
								//       T extends Exclude<
								//         DefaultNodeTypes,
								//         SerializedRelationshipNode
								//       >,
								//     >(
								//       node: T,
								//     ) => {
								//       if (node.type) {
								//         (node as SerializedParagraphNode).children.reduce(
								//           (prev, next) => {
								//             return prev + (next as SerializedTextNode).text;
								//           },
								//           "",
								//         );
								//       }
								//     };
								//     childrenNodes.forEach((node) => {});
								//   },
								// ],
							},
							label: false,
							required: true,
						},
					],
					label: "Content",
					access: {
						read: ({siblingData, data, doc, req}) => {
							const {user, payload} = req;
							const idc = doc as Post;
							if (idc._status !== "published") {
								if (!user) {
									return false;
								}

								if (idc.author === user.id) return true;
								return false;
							}
							if (idc.locked) {
								if (!user) {
									return false;
								}
								//locked related stuff
								if (user?.role === "admin") return true;
								const authLevel = idc.authority ?? 0;
								const allowed = idc.allowList ?? [];
								if (authLevel > 0) {
									if (roleToAuthority(user?.role ?? "user") >= authLevel) {
										return true;
									}
								}
								return allowed.some((all) => all === user?.id);
							} else {
								return true;
							}
							return true;
						},
					},
				},
				{
					fields: [
						{
							name: "relatedPosts",
							type: "relationship",
							admin: {
								position: "sidebar",
							},
							filterOptions: ({req, id}) => {
								const user = req.user;
								if (!user) {
									return {
										author: {
											exists: false,
										},
									} as Where;
								}
								return {
									and: [
										{
											id: {
												not_in: [id],
											},
										},
										{
											_status: {
												equals: "published",
											},
										},
										{
											author: {
												equals: user.id,
											},
										},
									],
								};
							},
							hasMany: true,
							maxRows: 5,
							relationTo: "posts",

							maxDepth: 0,
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
							name: "category",
							type: "relationship",
							label: "Category",
							required: true,
							defaultValue: async ({req}) => {
								const categories = await req.payload.find({
									collection: "categories",
									where: {
										slug: {
											equals: "uncategorized",
										},
									},
									depth: 0,
								});
								return categories.docs[0];
							},
							hasMany: false,
							maxDepth: 1,
							relationTo: "categories",
							admin: {
								allowCreate: false,
								allowEdit: false,
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
					],
				},
			],
		},
		{
			name: "image",
			label: "Hero Image",
			type: "upload",
			maxDepth: 1,
			relationTo: "userMedia",
			admin: {
				position: "sidebar",
			},
			filterOptions: ({req}) => {
				return {
					and: [
						{
							mimeType: {
								like: "image/",
							},
						},
						{
							author: {
								equals: req.user?.id,
							},
						},
					],
				} as Where;
			},
		},
		{
			name: "subtitle",
			type: "text",
			label: "Subtitle",
			admin: {
				position: "sidebar",
			},
			required: true,
		},
		{
			name: "publishedAt",
			label: "Publish Date",
			type: "date",
			admin: {
				date: {
					pickerAppearance: "dayAndTime",
				},
				position: "sidebar",
			},
		},
		...AuthorField(false),
		...slugField("title", {
			slugOverrides: {
				admin: {
					position: "sidebar",
				},
				required: true,
			},
		}),
		{
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target",
			admin: {
				hidden: true,
			},
		},
	],
	hooks: {
		beforeChange: [
			sanitizeAuthor(false),
			({data, operation, originalDoc, req}) => {
				const {user} = req;

				const datum = data as Partial<Post>;

				if (!datum.subtitle) {
					if (operation === "create") {
						const firstBlock = datum?.content?.root?.children?.at(0);
						if (firstBlock) {
							if (firstBlock.type === "heading") {
								data.subtitle = firstBlock.text ?? "";
							} else if (firstBlock.type === "paragraph") {
								data.subtitle = firstBlock.text ?? "";
							}
						}
					} else {
						data.subtitle =
							originalDoc.subtitle ??
							datum?.content?.root?.children?.at(0)?.text ??
							"";
					}
				}
				return data;
			},
			populatePublishedAt,
		],
		afterChange: [revalidatePost],

		afterDelete: [revalidateDelete],
	},
	endpoints: [
		{
			path: "/:slug/article",
			method: "post",
			handler: async (req) => {
				const post = await getPostHandler({req});
				if (!post) {
					return Response.json({error: "Post not found"}, {status: 404});
				}
				return Response.json(post, {
					headers: headersWithCors({
						headers: new Headers(),
						req,
					}),
				});
			},
		},
		{
			path: "/:id/getBookmarks",
			method: "get",
			handler: postBookmarksHandler,
		},
		{
			path: "/:id/bookmark",
			method: "post",
			handler: postBookmarkSaveHandler,
		},
		{
			path: "/:id/unBookmark",
			method: "post",
			handler: unBookmarkPostHandler,
		},
	],
	versions: {
		drafts: {
			autosave: false,
			schedulePublish: true,
		},

		maxPerDoc: 50,
	},
};
