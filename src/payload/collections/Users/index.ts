import {CollectionConfig, Where} from "payload";
import {
	MetaDescriptionField,
	MetaImageField,
	MetaTitleField,
	OverviewField,
} from "@payloadcms/plugin-seo/fields";
import {
	revalidateDelete as afterDeleteUser,
	revalidateUser,
} from "./hooks/revalidateUser";
import {validateHandler} from "./endpoints/validateHandle";
import {getServerSideURL} from "@/utilities/getURL";
import {generatePreviewPath} from "@/utilities/generatePreviewPath";
import {getUserBookmarks} from "../Bookmarks/getUserBookmarks";
import {userHandleField} from "@/payload/fields/handle";
import {getUserFollowers} from "./endpoints/getUserFollowers";
import {getUserFollowing} from "./endpoints/getUserFollows";
import {createCuid} from "@/utilities/stringUtilities";
import {afterChangeUsers} from "@collections/Users/hooks/afterChange";
import {GotUser} from "@collections/Users/endpoints/getUser";
import {SyncedNotification} from "@collections/Notifications/hooks/types";

export const Users: CollectionConfig = {
	slug: "users",

	defaultPopulate: {
		name: true,
		slug: true,
		label: true,
		portrait: true,
		image: true,

		role: true,
		protected: true,
		verified: true,
	},
	auth: {
		disableLocalStrategy: true,
		useSessions: false,
	},
	admin: {
		defaultColumns: ["username", "name"],
		listSearchableFields: ["name", "email", "username"],

		hidden: ({user}) => {
			if (!user) return true;
			if (user?.role === "admin") return false;
			return true;
		},
		useAsTitle: "username",
		livePreview: {
			url: ({data, req}) => {
				const path = generatePreviewPath({
					slug: typeof data?.slug === "string" ? data.slug : "",
					collection: "users",
					req,
				});

				return `${getServerSideURL()}${path}`;
			},
		},
		preview: (doc, {req}) => {
			const path = generatePreviewPath({
				slug: typeof doc?.slug === "string" ? doc.slug : "",
				collection: "users",
				req,
			});

			return `${getServerSideURL()}${path}`;
		},
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
			name: "id",
			type: "text",
			required: true,
			unique: true,
			defaultValue: () => createCuid(),
			admin: {
				hidden: true,
			},
			access: {
				read: () => true,
			},
		},
		{
			name: "portrait",
			type: "text",
			admin: {
				hidden: true,
			},
		},
		{
			name: "firstName",
			type: "text",
			required: true,
			index: true,
			defaultValue: "First And",
			admin: {
				hidden: true,
			},
		},
		{
			name: "lastName",
			type: "text",
			required: true,
			index: true,
			defaultValue: "The Last",
			admin: {
				hidden: true,
			},
		},
		{
			name: "foto",
			type: "ui",
			admin: {
				components: {
					Field: {
						path: "src/payload/fields/ProfileImage/serverProfileField.tsx",
						serverProps: {
							relationTo: "userMedia",
							urlPath: "image",
							idPath: "portrait",
						},
					},
				},
			},
		},
		{
			name: "profile",
			type: "join",
			on: "author",
			collection: "profile",
			admin: {
				allowCreate: false,
			},
			defaultLimit: 1,
		},
		{
			name: "bio",
			type: "text",
			index: true,
			label: "Bio",
			defaultValue: "A member of The Hideaway.",
			admin: {
				description:
					"A short description of yourself, your passion, work, interest, anything- just keep it interesting.",
			},
		},
		{
			name: "location",
			type: "text",
			index: true,
			defaultValue: "Seoul",
		},
		{
			name: "link",
			type: "text",
			index: true,
			defaultValue: "https://thehideaway.com",
			admin: {
				description: "A link to your website or social media profile.",
			},
		},
		{
			name: "dynamicLabel",
			type: "ui",
			admin: {
				components: {
					Field: "src/payload/fields/DynamicLabel/index.tsx",
				},
			},
		},
		...userHandleField(),

		{
			name: "bookmarks",
			type: "join",
			admin: {
				hidden: true,
			},
			collection: "bookmarks",
			on: "user",
		},
		{
			type: "group",
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
					relationTo: "userMedia",
					overrides: {
						maxDepth: 2,
						filterOptions: ({req, siblingData, user}) => {
							if (!user) {
								return false;
							}
							const w: Where = {
								and: [
									{
										author: {
											equals: user?.id,
										},
									},
									{
										mimeType: {
											contains: "image",
										},
									},
									{
										filesize: {
											less_than: 3520000,
										},
									},
								],
							};
							return w;
						},
					},
				}),
				MetaDescriptionField({}),
			],
		},
		{
			name: "followers",
			type: "join",
			on: "target",
			admin: {
				hidden: true,
			},
			collection: "follows",
		},
		{
			name: "following",
			type: "join",
			admin: {
				hidden: true,
			},
			on: "user",
			collection: "follows",
		},
		{
			name: "notifications",
			type: "join",
			defaultSort: "-createdAt",
			where: {
				dismissed: {
					not_equals: true,
				},
			},
			defaultLimit: 50,
			maxDepth: 2,
			admin: {
				hidden: true,
			},
			on: "recipient",
			collection: "notifications",
		},
		{
			name: "onboarded",
			type: "checkbox",
			defaultValue: false,

			index: true,
			access: {
				update: ({req}) => {
					if (req.context.overrideAccess === true) return true;
					if (req.user?.role === "admin") return true;
					return false;
				},
			},
			required: true,
		},
	],
	hooks: {
		afterRead: [
			async ({context, req, doc}) => {
				// const profile = await req.payload
				//   .count({
				//     collection: "profile",
				//     overrideAccess: true,
				//     where: {
				//       author: {
				//         equals: user.id,
				//       },
				//     },
				//   })
				//   .then((res) => res.totalDocs || 0)
				//   .catch((e) => {
				//     req.payload.logger.error(
				//       `Error fetching profile for user ${user.id}`,
				//       e,
				//     );
				//     return 0;
				//   });
				// if (profile < 1) {
				//   await createProfile({ req, doc:user }).catch((e) => {
				//     req.payload.logger.error(
				//       `Error creating profile for user ${user.id}`,
				//       e,
				//     );
				//   });
				// }
				return doc;
			},
		],
		beforeChange: [
			({data, req, operation, originalDoc, context}) => {
				const state = data?.banned ? "draft" : "published";
				data._status = state;
				if (operation === "create") {
					context.overrideAccess = true;
					context.createProfile = true;
				}
				if (operation === "update") {
					context.overrideAccess = true;
				}
				return data;
			},
		],
		afterChange: [revalidateUser, afterChangeUsers],
		afterDelete: [afterDeleteUser],
	},
	endpoints: [
		{
			path: "/validateHandle",
			method: "post",
			handler: validateHandler,
		},

		{
			path: "/:id/following",
			method: "get",
			handler: getUserFollowing,
		},
		{
			path: "/:id/followers",
			method: "get",
			handler: getUserFollowers,
		},

		{
			path: "/:id/bookmarks",
			method: "get",
			handler: getUserBookmarks,
		},
		{
			path: "/:id/details",
			method: "get",
			handler: async (req) => {
				const {payload, routeParams} = req;
				const rid = routeParams?.id;
				if (!rid || typeof rid !== "string") {
					return Response.json(
						{
							error: "Invalid param provided",
						},
						{status: 404},
					);
				}
				const id = `${rid}`;

				const res = await payload.findByID({
					collection: "users",
					overrideAccess: true,
					id: id,
					select: {
						firstName: true,
						lastName: true,
						displayUsername: true,
						portrait: true,
						slug: true,
						username: true,
						name: true,
						onboarded: true,
						role: true,
						bio: true,
						following: true,
						followers: true,
						notifications: true,
					},
				}).catch((e) => {
					console.error(`Error fetching user ${id}`, e);
					return null;
				});
				if (!res) {
					const message = `User ${id} not found`;
					console.error(message);
					return Response.json(
						{
							error: message,
						},
						{status: 404},
					);
				}

				const {portrait, ...rest} = res;
				const user: GotUser = {
					...rest,
					following: {
						count: rest.following?.totalDocs ?? 0,
						docs: (rest.following?.docs || ([] as string[])).map((r) =>
							typeof r === "string"
								? r
								: typeof r.target === "string"
									? r.target
									: r.target.id,
						),
					},
					followers: {
						count: rest.followers?.totalDocs ?? 0,
						docs: (rest.followers?.docs || ([] as string[])).map((r) =>
							typeof r === "string"
								? r
								: typeof r.user === "string"
									? r.user
									: r.user.id,
						),
					},
					portrait: portrait ?? null,
					id: `${rest.id}`,
					role: rest.role!,
					onboarded: rest.onboarded ?? false,
					slug: rest.slug ?? rest.name,
					username: rest.username ?? rest.slug ?? rest.name,
					displayUsername:
						rest.displayUsername ??
						`@${rest.username ?? rest.slug ?? rest.name}`,
					collection: "users",
					notifications:
						(rest.notifications?.docs as SyncedNotification[]) ?? [],
					bio: rest.bio ?? "",
				};

				// const notifications: SyncedNotification[] = await queryNotifications({
				//   id: user.id,
				//   payload,
				// }).catch((e) => {
				//   console.error(`Error fetching notifications for user ${user.id}`, e)
				//   return []
				// })
				// user.notifications = notifications
				console.log("user in getUser", user);
				return Response.json({user}, {status: user ? 200 : 400});
			},
		},
	],
	versions: {
		drafts: {
			autosave: false,
		},
		maxPerDoc: 20,
	},
};
