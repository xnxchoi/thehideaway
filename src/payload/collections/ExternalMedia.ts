import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField";
import {fundFields} from "@/payload/plugins/image-search/collections/collectionFields";
import {authenticated, isAuthorOrEditor} from "@/payload/plugins/locker/access/accessCheckers";
import {User} from "@payload-types";
import path from "path";
import {CollectionConfig} from "payload";
import {fileURLToPath} from "url";
import {uuidv7} from "uuidv7";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
export const ExternalMedia: CollectionConfig = {
	slug: "exMedia",
	access: {
		read: () => true,
		create: authenticated,
		update: () => false,
		delete: isAuthorOrEditor
	},
	defaultPopulate: {
		author: true,
		src: true,
		url: true,
		filename: true,
		mimeType: true,
		width: true,
		height: true,
		darkmode: true,
		source: true,
	},
	fields: [
		...fundFields,

		{
			name: "src",
			type: "text",
			required: true,
			virtual: "source.link",
			access: {
				read: () => true,
				update: isAuthorOrEditor,
			}
		}, ...AuthorField(),

		{
			name: "source",
			type: "group",
			virtual: true,
			required: true,
			fields: [
				{
					name: "provider", type: "select", options: [
						"external", "pexels", "unsplash", "local"
					], required: true, defaultValue: "external"
				},
				{name: "link", required: true, type: "text",},
				{name: "identifier", type: "text", required: true, defaultValue: uuidv7}
			], admin: {
				hidden: true
			}
		}, {
			name: "blurDataUrl",
			type: "text", virtual: true
		}, {
			name: "caption",
			type: "text",
			virtual: true,
			defaultValue: () => ""
		},
	],
	folders: false,
	admin: {
		hidden: ({user}) => !(user.collection === "admins" || (["admin", "editor"].some(roleName => roleName === (user as User & {
			collection: "users"
		}).role)))
	},
	upload: {
		focalPoint: true,
		staticDir: path.resolve(dirname, "../../../public/externalMedia"),
		mimeTypes: ["image/*"],
		formatOptions: {
			format: "webp",
			options: {
				quality: 85,
			}
		}, adminThumbnail: "thumbnail",
		imageSizes: [{
			name: "thumbnail",
			width: 300,
		}]

	}
}