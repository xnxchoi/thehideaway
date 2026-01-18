import {Bookmark} from "@payload-types";
import {CollectionConfig} from "payload";
import {uuidv7} from "uuidv7";
import {createValidQueryStringRegex} from "../../../utilities/regexUtilities";
import {filterByCurrentUser} from "../helpers";

export const bookmarkTypes: Bookmark["target"]["relationTo"][] = [
	"posts",
	"delta",
	"profile",

	"users",
	"albums",
	"playlists",
	//
	"tracks",
	"userMedia"
];
export const validTypes = [
	"posts",
	"delta",
	"profile",

	"users",
	"albums",
	"playlists",
	//
	"tracks",
	"userMedia"
] as const;
export const bookmarkTypesRegex = createValidQueryStringRegex(bookmarkTypes);
export const Bookmarks: CollectionConfig = {
	slug: "bookmarks",
	admin: {
		useAsTitle: "id",
		baseFilter: filterByCurrentUser
	},
	access: {
		read: ({req}) => {
			return true;
		}
	},
	fields: [
		{
			name: "id",
			type: "text",
			defaultValue: uuidv7,
			access: {
				update: () => false
			},
			required: true,
			admin: {
				hidden: true
			}
		},
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
				update: () => false
			}
		},
		{
			name: "target",
			type: "relationship",
			relationTo: [...validTypes],
			required: true,
			hasMany: false,
			index: true,
			maxDepth: 1,
			access: {
				read: () => true,
				create: () => true,
				update: () => false
			}
		}
	],
	hooks: {
		beforeChange: [
			async ({data, req, operation, originalDoc}) => {
				if (!req.user) {
					return;
				}
				if (operation === "create") {
					const bookmarkExists = await req.payload
						.count({
							collection: "bookmarks",
							where: {
								and: [
									{
										"target.relationTo": {
											equals: data.target.relationTo
										}
									},
									{
										"target.value": {
											equals: data.target.value
										}
									},
									{
										user: {
											equals: data.user
										}
									}
								]
							}
						})
						.then((count) => {
							return count.totalDocs > 0;
						})
						.catch((err) => {
							console.error(err);
							return false;
						});
					if (!bookmarkExists) {
						return data;
					}
				}
				if (operation === "update") {
					return originalDoc;
				}
			}
		]
	}
};
