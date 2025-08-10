import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField";
import {CollectionBeforeChangeHook, CollectionConfig, Where} from "payload";
import {
	CitationRange,
	ProcessedRangy,
} from "@/components/UX/Highlightr/types";
import {Citation} from "@/payload-types";

export const Citations: CollectionConfig = {
	slug: "citations",
	defaultPopulate: {
		id: true,
		cited: true,
		target: true,
		user: true,
		quote: true,
		selection: true,
	},
	admin: {
		useAsTitle: "quote",
		// components: {
		//   views: {
		//     edit: {
		//       default: {
		//         Component: "@/payload/views/Edit/index.tsx#DefaultEditView",
		//       },
		//     },
		//     list: {
		//       Component: "@/payload/views/List/.tsx",
		//     },
		//   },
		// },
		baseListFilter: ({req}) => {
			const user = req.user;
			if (!user)
				return {
					private: {
						not_equals: true,
					},
				};
			if (user.role === "admin")
				return {
					id: {
						exists: true,
					},
				};
			const query: Where = {
				or: [
					{
						private: {
							not_equals: true,
						},
					},
					{
						author: {
							equals: user.id,
						},
					},
				],
			};
			return query;
		},
	},
	access: {
		read: ({req}) => {
			const ctx = req.context;
			const overrideAccess = ctx.overrideAccess;
			if (overrideAccess) {
				return true;
			}
			const user = req.user;
			if (!user) {
				return {
					private: {
						not_equals: true,
					},
				};
			}
			if (user.role === "admin") {
				return true;
			}
			return {
				or: [
					{
						private: {
							not_equals: true,
						},
					},
					{
						author: {
							equals: user.id,
						},
					},
				],
			} as Where;
		},
		create: ({req}) => {
			const ctx = req.context;
			const overrideAccess = ctx.overrideAccess;
			if (overrideAccess) {
				return true;
			}
			const user = req.user;
			if (!user) {
				return false;
			}
			return true;
		},
		update: ({req}) => {
			const ctx = req.context;
			const overrideAccess = ctx.overrideAccess;
			if (overrideAccess) {
				return true;
			}
			const user = req.user;
			if (!user) {
				return false;
			}
			if (["editor", "admin"].some((role) => role === user.role)) {
				return true;
			}
			return {
				author: {
					equals: user.id,
				},
			};
		},
		delete: ({req}) => {
			const ctx = req.context;
			const overrideAccess = ctx.overrideAccess;
			if (overrideAccess) {
				return true;
			}
			const user = req.user;
			if (!user) {
				return false;
			}
			if (["editor", "admin"].some((role) => role === user.role)) {
				return true;
			}
			return {
				author: {
					equals: user.id,
				},
			};
		},
	},
	fields: [
		{
			name: "color",
			type: "text",
			defaultValue: () => "oklch(84.43% 0.065 210.91)",
			required: true,
			index: true,
		},
		{
			name: "path",
			type: "text",
			required: true,
			defaultValue: "/",
			access: {
				update: ({data, req}) => {
					const ctx = req.context;
					const overrideAccess = ctx.overrideAccess;
					if (overrideAccess) {
						return true;
					}
					const user = req.user;
					if (!user) {
						return false;
					}
					if (["editor", "admin"].some((role) => role === user.role)) {
						return true;
					}
					return false;
				},
			},
			admin: {
				hidden: true,
			},
		},
		{
			name: "reference",
			type: "text",
			required: true,
			defaultValue: "",
			admin: {
				hidden: true,
			},
			index: true,
			access: {
				update: () => false,
			},
		},
		{
			name: "selection",
			type: "group",
			required: true,
			access: {
				update: ({req}) => {
					const ctx = req.context;
					const overrideAccess = ctx.overrideAccess;
					if (overrideAccess) {
						return true;
					}
					const user = req.user;
					if (!user) {
						return false;
					}
					if (["editor", "admin"].some((role) => role === user.role)) {
						return true;
					}
					return false;
				},
			},
			admin: {
				hidden: true,
			},

			fields: [
				{
					name: "text",
					type: "text",
					required: true,
				},
				{
					name: "before",
					type: "text",
					required: true,
					defaultValue: "",
				},
				{
					name: "after",
					type: "text",
					defaultValue: "",
					required: true,
				},
			],
		},
		{
			name: "private",
			type: "checkbox",
			defaultValue: false,
			required: true,
			index: true,
		},
		{
			name: "quote",
			type: "text",
			required: true,
			defaultValue: "",

			admin: {
				readOnly: true,
			},
		},
		...AuthorField(false),

		{
			access: {
				read: () => true,
				update: ({req}) => {
					const ctx = req.context;
					const overrideAccess = ctx.overrideAccess;
					if (overrideAccess) {
						return true;
					}
					const user = req.user;
					if (!user) {
						return false;
					}
					if (user.role === "admin") {
						return true;
					}
					return false;
				},
			},
			name: "target",
			type: "relationship",
			relationTo: ["delta", "posts"],
			hasMany: false,
			maxDepth: 0,
			index: true,
			required: true,
			admin: {
				readOnly: true,
			},
		},
		{
			name: "cited",
			type: "relationship",
			relationTo: "users",
			hasMany: false,
			required: true,
			maxDepth: 0,
			access: {
				update: ({req}) => {
					if (req.context.overrideAccess === true) {
						return true;
					}
					return req.user?.role === "admin";
				},
			},
			index: true,
		},
		{
			name: "memo",
			type: "textarea",
		},
	],
	timestamps: true,
	endpoints: [
		{
			path: "/getNotes",
			method: "get",
			handler: async (req) => {
				const user = req.user;
				const params = req.query;
				const id = params?.id;
				const collection = params?.collection;
				if (
					!id ||
					!collection ||
					typeof id !== "string" ||
					typeof collection !== "string" ||
					(collection !== "posts" && collection !== "delta")
				) {
					return Response.json(
						{
							error: "Unauthorized",
							message: "Invalid route - id is required",
						},
						{
							status: 401,
						},
					);
				}
				if (!user) {
					return Response.json(
						{
							error: "Unauthorized",
							message: "You must be logged in to access this endpoint",
						},
						{
							status: 401,
						},
					);
				}
				const isgood = user.collection === "admins" || !user.banned;
				if (!isgood) {
					return Response.json(
						{
							error: "Unauthorized",
							message: "You have been banned from using this endpoint",
						},
						{
							status: 401,
						},
					);
				}
				const payload = req.payload;
				try {
					const cites = await payload.find({
						collection: "citations",
						where: {
							and: [
								{
									"target.value": {
										equals: id,
									},
								},
								{
									author: {
										equals: user.id,
									},
								},
							],
						},
						select: {
							selection: true,
							private: true,
							reference: true,
							color: true,
							createdAt: true,
							quote: true,
							path: true,
							memo: true,
						},
						overrideAccess: true,
						limit: 100,
						context: {
							...req.context,
							overrideAccess: true,
						},
						pagination: false,
						sort: "-createdAt",
					}).then((r) => r.docs || ([] as CitationRange[]));

					const citations: ProcessedRangy[] = cites.flatMap((cite) => {
						if (!cite.selection.text || !cite.selection.after) return [];
						return {
							selection: {
								before: cite.selection.before,
								text: cite.selection.text,
								after: cite.selection.after,
							},
							color: cite.color,
							path: cite.path,
							reference: cite.reference,
							private: cite.private || false,
							createdAt: cite.createdAt,
							memo: cite.memo || null,
						} satisfies ProcessedRangy;
					});
					return Response.json(
						{
							docs: citations,
							user: user.id,
							target: {
								value: id,
								relationTo: collection,
							},
						},
						{
							status: 200,
						},
					);
				} catch (e) {
					payload.logger.error(
						e,
						`Error fetching citations for ${collection} id: ${id} with user ${user.id}`,
					);
					return Response.json(
						{
							error: "Internal Server Error",
							message: "An error occurred while fetching citations",
						},
						{
							status: 500,
						},
					);
				}
			},
		},
	],
	hooks: {
		beforeValidate: [
			async ({
				data,
				operation,
				req,
				context,
				originalDoc,
			}: Parameters<CollectionBeforeChangeHook<Citation>>[0]) => {
				if (operation === "update" || operation === "create") {
					switch (operation) {
						case "update": {
							if (!originalDoc) {
								req.payload.logger.error(
									{
										message: "Original doc not found",
										data,
										operation,
										req,
										context,
										originalDoc,
									},
									"Original doc not found",
								);
								throw new Error("Original doc not found");
							}
							const selection = {
								before: `...\"`,
								text: `${data?.selection?.text || originalDoc!.selection.text}`,
								after: `...\"`,
							};
							const quote = `\"...${selection.text}...\"`;
							const path = data?.path || originalDoc.path;
							const reference = originalDoc.reference;
							data.selection = selection;
							data.quote = quote;
							data.path = path;
							data.reference = reference;
							return data;
						}
						case "create": {
							if (!data?.selection) {
								req.payload.logger.error({
									message: "Selection not found",
									data,
									operation,
									req,
									context,
								});
								throw new Error("Selection not found");
							}
							const selection = {
								before: `...\"`,
								text: `${data?.selection?.text}`,
								after: `...\"`,
							};
							data.selection = selection;
							data.quote = `\"...${selection.text}...\"`;
							return data;
						}
					}
				}
				return data;
			},
		],
	},
};
