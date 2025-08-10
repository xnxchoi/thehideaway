import {CollectionConfig, Where} from "payload";

import {extractImageInfo} from "@/utilities/extractImageInfo";
import path from "path";
import {fileURLToPath} from "url";
import {
	authenticated,
	standardUpdateAccess,
} from "../plugins/locker/access/accessCheckers";
import {AuthorField} from "../fields/AuthorFields/AuthorField";
import {sanitizeAuthor} from "../fields/AuthorFields/hooks";
import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import {filterDocByCurrentUser} from "../utilities/filterDocByCurrentUser";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export const Media: CollectionConfig = {
	slug: "media",
	admin: {
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
		url: true,
		filename: true,
		mimeType: true,
		width: true,
		height: true,
		darkmode: true,
	},

	access: {
		create: authenticated,
		delete: standardUpdateAccess,
		read: ({req}) => {
			const user = req.user;
			if (!user || !user.role)
				return {
					_status: {
						equals: "published",
					},
				};
			if (["editor", "admin"].includes(user?.role)) return true;
			const stat: Where = {
				_status: {equals: "published"},
			};
			return {
				or: [
					stat,
					{
						author: {
							equals: user.id,
						},
					},
				],
			} as Where;
		},
		update: standardUpdateAccess,
	},
	fields: [
		{
			name: "alt",
			type: "text", //required: true,
		},
		{
			name: "caption",
			type: "text",
		},
		{
			name: "darkmode",
			type: "checkbox",
			defaultValue: false,
			index: true,
		},
		...AuthorField(),
		{
			name: "publishedAt",
			type: "date",
			admin: {
				date: {
					pickerAppearance: "dayAndTime",
				},
			},
		},
	],
	upload: {
		// Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
		staticDir: path.resolve(dirname, "../../../public/media"),
		adminThumbnail: "thumbnail",
		focalPoint: true,
		filenameCompoundIndex: ["filename", "alt"],
		formatOptions: {format: "webp"},
		mimeTypes: ["image/*", "video/*", "audio/*", "application/pdf"],
		imageSizes: [
			{
				name: "thumbnail",
				width: 300,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "square",
				width: 500,
				height: 500,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "small",
				width: 600,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "medium",
				width: 900,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "large",
				width: 1400,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "xlarge",
				width: 1920,
				formatOptions: {
					format: "webp",
				},
			},
			{
				name: "og",
				width: 1200,
				height: 630,
				crop: "center",
				formatOptions: {
					format: "webp",
				},
			},
		],
	},
	hooks: {
		beforeOperation: [
			async (args) => {
				const {operation, context, req} = args;
				if (operation === "create" || operation === "update") {
					if (req.file && req.file.mimetype.indexOf("image") > -1) {
						const {darkmode} = await extractImageInfo({req: req});
						if (typeof darkmode === "boolean") {
							context.darkmode = darkmode;
						}
					}
				}
				return args;
			},
		],
		beforeChange: [
			sanitizeAuthor(false),
			populatePublishedAt,
			async ({data, operation, req, context}) => {
				if (operation === "create" || operation === "update") {
					if (req.file && req.file.mimetype.indexOf("image") > -1 && context) {
						data.darkmode = context.darkmode ?? false;
					}
				}
				return data;
			},
		],
	},
	versions: {
		drafts: {
			autosave: {
				interval: 1500, // We set this interval for optimal live preview
			},
			schedulePublish: true,
		},
		maxPerDoc: 5,
	},
};
