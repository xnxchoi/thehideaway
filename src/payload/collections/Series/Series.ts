import {slugField} from "@/payload/fields/slug"
import {AccessArgs, CollectionConfig, Where} from "payload"
import {sanitizeAuthor} from "../../fields/AuthorFields/hooks"

import {populatePublishedAt} from "@/hooks/populatePublishedAt"
import {getSeriesBookMarks} from "./endpoints/getSeriesBookmarks"
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser"
import {Member, Organization} from "@/payload-types"

export const Series: CollectionConfig = {
	slug: "series",
	labels: {
		singular: "Série",
		plural: "Séries",
	},
	admin: {
		useAsTitle: "title",
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
	access: {
		read: ({req: {user}}: AccessArgs) => {
			if (!user) return false
			if (user?.role === "editor" || user?.role === "admin") return true
			if (user?.role === "author") {
				return {
					or: [
						{
							author: {
								equals: user.id,
							},
							owner: {
								equals: user.id,
							},
							_status: {
								equals: "published",
							},
						},
					],
				}
			}
			return false
		},
		create: ({req: {user}}: AccessArgs) => {
			if (!user) return false
			if (user?.role && ["admin", "editor", "author"].includes(user.role))
				return true
			return false
		},
		update: ({req: {user}}: AccessArgs) => {
			if (!user) return false
			if (["admin", "editor"].some((r) => r === user?.role)) return true
			if (user?.role === "author") {
				return {
					or: [
						{
							author: {
								equals: user.id,
							},
						},
						{
							owner: {
								equals: user.id,
							},
						},
					],
				} as Where
			}

			return false
		},
		delete: ({req: {user}}: AccessArgs) => {
			if (!user) return false
			if (user?.role === "admin") return true

			if (["admin", "editor"].some((r) => r === user?.role)) {
				return {
					owner: {
						equals: user.id,
					},
				}
			}

			return false
		},
	},
	fields: [
		{
			name: "title",
			type: "text",
			required: true,
		},
		{
			name: "description",
			type: "text",
		},
		{
			name: "cover",
			type: "number",

			defaultValue: 0,
			admin: {
				hidden: true,
			},
		},
		{
			name: "owner",
			type: "relationship",
			relationTo: "members",
			hasMany: false,
			maxDepth: 0,
			index: true,
			required: true,
			hooks: {
				beforeValidate: [
					async ({
						value,
						req,
						data,
						siblingData,
						operation,
						previousDoc,
						previousValue,
						overrideAccess
					}) => {
						const {user, payload} = req
						if (!user && !overrideAccess) return null
						if (operation === "create") {
							if (value) return value
							if (!user) return null
							const curSession = await payload.find({
								collection: "sessions",
								where: {
									user: {
										equals: user.id
									}
								},
								sort: "-updatedAt",
								limit: 1,
								depth: 1,
								select: {
									activeOrganization: true,

								}
							}).then((r) => {
								if (r.docs.length > 0) {
									const org = r.docs.at(0)!.activeOrganization
									if (typeof org === "number") return org
									return org?.id ?? null
								}
								return null
							})
							if (!curSession) return null
							const userMember = await payload.find({
								collection: "members",
								where: {
									and: [
										{
											organization: {
												equals: curSession
											}
										},
										{
											user: {
												equals: user.id
											}
										}
									]
								},
								select: {
									user: true,
									role: true
								},
								depth: 1
							}).then((r) => {
								if (r.docs.length > 0) {
									const us = r.docs.at(0)!.user
									if (typeof us === "number") return us
									return us.id
								}
								return null
							}).catch((e) => {
								console.log(e)
								return null
							})
							if (userMember) return userMember
							return null
						} else if (operation === "update") {
							if (value) {
								if (!data) return previousValue
								let org = data?.organization || previousDoc?.organization
								if (!org) {
									org = await payload.findByID({
										collection: 'series',
										id: data.id,
										select: {
											organization: true
										}
									}).then((r) => {
										if (r.organization) return r.organization
										return null
									})
									if (!org) return previousValue
									const userMember = await payload.count({
										collection: "members",
										where: {
											and: [
												{
													organization: {
														equals: org
													}
												},
												{
													user: {
														equals: value
													}
												}
											]
										}
									}).then((r) => {
										return r.totalDocs > 0
									}).catch((e) => {
										console.log(e)
										return false
									})
									if (!userMember) return previousValue
									return value
								} else {
									return previousValue
								}
							} else {
								return previousValue
							}
						}
					},
				],
			}
		},
		{
			name: "coverurl",
			type: "text",

			defaultValue: "",
			admin: {
				hidden: true,
			},
		},
		{
			name: "covere",
			type: "ui",
			admin: {
				components: {
					Field: {
						path: "@/payload/fields/ImageField/serverImageField.tsx",
						serverProps: {
							relationTo: "media",
							idPath: "cover",
							urlPath: "coverurl",
							path: "covere",
						},
					},
				},
			},
		},
		{
			name: "organization",
			type: "relationship",
			relationTo: "organizations",
			hasMany: false,
			index: true,
			required: true,
			filterOptions: async ({data, req}) => {
				if (!req.user) return false
				const userMember = await req.payload.find({
					collection: "members",
					where: {
						and: [
							{
								user: {
									equals: req.user.id
								}
							},
							{
								role: {
									in: ["owner", "editor"]
								}
							}
						]
					},
					select: {
						organization: true
					},
					depth: 1
				}).then((r) => {
					if (r.docs.length > 0) {
						const org = r.docs.map((m) => {
							if (typeof m.organization === "number") return m.organization
							return m.organization.id
						})
						return org
					}
					return null
				}).catch((e) => {
					console.log(e)
					return null
				})
				if (userMember) return {
					id: {
						in: userMember
					}
				}
				return false
			},
		},
		{
			name: "author",
			type: "relationship",
			relationTo: "users",
			hasMany: true,
			maxRows: 3,
			maxDepth: 0,
			filterOptions: async ({data, req}) => {
				if (!data.organization) return false
				const org = data.organization as Organization["id"]
				const members = await req.payload.find({
					collection: "members",
					where: {
						organization: {
							equals: org,
						},
					},
					select: {
						user: true,
					},
				}).then((r) => {
					if (r.docs.length > 0) {
						const us = r.docs.map((m) => {
							if (typeof m.user === "number") return m.user
							return m.user.id
						})
						return us

					}
				}).catch((e) => {
					console.log(e)
					return null
				})
				if (members) {
					return {
						id: {
							in: members
						}
					}
				}
				return false
			},
			hooks: {
				beforeValidate: [
					async ({
						value,
						req,
						data,
						siblingData,
						operation,
						previousDoc,
						previousValue,
					}) => {
						if (operation === "create" || operation === "update") {
							if (!data?.organization) {
								return []
							}
							if (!value || !Array.isArray(value) || value.length < 1) {
								if (
									!siblingData["organization"] ||
									typeof siblingData["organization"] !== "number"
								) {
									return
								}
								const org = siblingData.organization as Organization["id"]
								const owner = await req.payload.find({
									collection: "members",
									where: {
										and: [
											{
												organization: {
													equals: org,
												},
											},
											{
												role: {
													equals: "owner",
												},
											},
										],
									},
									select: {
										user: true,
									},
									depth: 1,
								}).then((r) => {
									if (r.docs.length > 0) {
										const us = r.docs.at(0)!.user
										if (typeof us === "number") return us
										return us.id
									}
									throw new Error("No owner found for organization")
								}).catch((e) => {
									console.log(e)
									return null
								})
								if (owner) {
									return [owner]
								}
								return []
							}
							const org = data.organization as Organization["id"]
							const valueID = value as Member["id"][]
							const members = await req.payload.find({
								collection: "members",
								where: {
									and: [
										{
											organization: {
												equals: org
											}
										},
										{
											user: {
												in: valueID
											}
										}
									]
								},
								select: {
									user: true,
								},
							}).then((r) => {
								return r.totalDocs > 0 ? r.docs.map((m) => {
										if (typeof m.user === "number") return m.user
										return m.user.id
									})
									: []
							}).catch((e) => {
								console.log(e)
								return []
							})
							return members

						}
					},
				],
			},
		},
		{
			name: "bookmarks",
			collection: "bookmarks",
			type: "join",
			on: "target",
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
		...slugField("title"),
		{
			index: true,
			name: "articles",
			type: "array",
			fields: [
				{
					name: "article",
					type: "relationship",
					relationTo: ["posts", "delta"],
					hasMany: false,
					filterOptions: (args) => {
						const user = args.req.user
						if (!user || !user.id || !user.role) return false

						if (["admin", "editor", "author"].includes(user.role)) {
							return {
								author: {
									equals: user.id,
								},
							}
						}
						return false
					},
				},
			],
			maxRows: 100,
			required: true,
		},
	],
	versions: {
		drafts: {
			autosave: {
				interval: 3000,
				showSaveDraftButton: true,
			},
			schedulePublish: true,
		},
		maxPerDoc: 15,
	},
	endpoints: [
		{
			path: "/:id/bookmarks",
			method: "get",
			handler: getSeriesBookMarks,
		},
	],
	hooks: {
		beforeChange: [sanitizeAuthor(true), populatePublishedAt],
	},
}
