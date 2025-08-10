import {CollectionConfig, Where} from "payload";
import {defaultLexical} from "@/payload/Lexical/defaultLexical";
import {
	generatePreviewPath,
	generatePreviewPathWithAuthor,
} from "@/utilities/generatePreviewPath";
import {getProfileBookmarks} from "./endpoints/getProfileBookmarks";
import {revalidateProfile} from "./hooks/revalidateProfile";
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser";
import {
	createBackgroundColorField,
	createColorField,
} from "@/payload/fields/ColorPicker";
import {revalidateDeleteProfile} from "@collections/Profile/hooks/afterDelete";

export const Profile: CollectionConfig = {
	slug: "profile",
	access: {
		readVersions: ({req}) => {
			const user = req.user;
			if (req.context.overrideAccess) return true;
			if (!user) return false;
			if (user.role === "editor" || user.role === "admin") return true;
			return {
				author: {
					equals: user.id,
				},
			} as Where;
		},
		read: ({req}) => {
			const user = req.user;
			if (req.context.overrideAccess) return true;
			if (!user)
				return {
					_status: {
						equals: "published",
					},
				};
			if (user.role === "editor" || user.role === "admin") return true;
			return {
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
			} as Where;
		},
		update: ({req, data}) => {
			if (req.context.overrideAccess) return true;
			const user = req.user;
			if (user?.role === "admin") return true;
			return {
				or: [
					{
						author: {
							equals: user?.id,
						},
					},
					{
						author: {
							exists: false,
						},
					},
				],
			};
		},
		delete: ({req}) => {
			if (req.context.overrideAccess) return true;
			if (req.user) {
				if (req.user.role === "admin") return true;
			}
			return false;
		},
	},
	admin: {
		baseListFilter: filterDocByCurrentUser,
		livePreview: {
			url: async ({data, req}) => {
				const author = data?.author || req.user?.id;
				if (!author) {
					throw new Error("Author is required to generate preview path");
				}
				const path = await generatePreviewPathWithAuthor({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "profile",
					req,
					userID: author,
				});

				return path;
			},
		},
		preview: (data, {req}) =>
			generatePreviewPath({
				slug: typeof data?.slug === "string" ? data.slug : "",
				collection: "profile",
				req,
			}),
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
			name: "author",
			type: "relationship",
			relationTo: "users",
			index: true,
			required: true,
			maxDepth: 0,
			hasMany: false,

			access: {
				read: () => true,
				create: () => true,
				update: () => false,
			},
		},

		{
			type: "tabs",
			tabs: [
				{
					label: "Slides",
					fields: [
						{
							type: "group",
							name: "hero",
							fields: [
								{
									type: "text",
									name: "title",
									required: true,
									label: "Title",
									defaultValue: "",
									index: true,
								},
								{
									type: "text",
									name: "subtitle",
									required: true,
									label: "Subtitle",
									defaultValue: "",
									index: true,
									admin: {},
								},
								createColorField({
									name: "gradient1",
									label: "Gradient 1",
								}),
								createBackgroundColorField({
									name: "gradient2",
									label: "Gradient 2",
								}),
							],
						},
						{
							type: "array",
							name: "slides",
							maxRows: 4,
							fields: [
								{
									type: "text",
									name: "title",
									required: true,
								},
								{
									type: "upload",
									relationTo: "userMedia",
									hasMany: false,
									name: "visuals",
									maxDepth: 0,
									filterOptions: ({req, user}) => ({
										author: {
											equals: user?.id,
										},
									}),
								},
								{
									name: "content",
									type: "richText",
									editor: defaultLexical,
								},
							],
						},
					],
				},
				{label: "Preview", fields: []},
			],
		},
		{
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target",
		},
	],
	hooks: {
		afterChange: [revalidateProfile],
		afterDelete: [revalidateDeleteProfile],
	},
	endpoints: [
		{
			path: "/:id/bookmarks",
			method: "get",
			handler: getProfileBookmarks,
		},
	],
	versions: {
		drafts: {
			autosave: {
				interval: 800,
				showSaveDraftButton: true,
			},
		},
		maxPerDoc: 50,
	},
};
