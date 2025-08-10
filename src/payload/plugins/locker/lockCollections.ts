import {
	Access,
	AccessArgs,
	AccessResult,
	CollectionConfig,
	CollectionSlug,
	Where,
} from "payload";
import {LockerPluginConfig} from "@/payload/plugins/locker/plugin";
import {lockBoxField} from "@/payload/plugins/locker/fields/lockbox/ index";
import {allowListField} from "@/payload/plugins/locker/fields/allowlist";
import {authorityField} from "@/payload/plugins/locker/fields/authority";
import {roleToAuthority} from "./fields/authority/utils";
import {mergeFields} from "@/utilities/mergeFields";
import {RP_Roles} from "@/stores/Notification/NotificationStore";

const authorlessLockedReadAccess = (args: { slug: CollectionSlug }) => {
	const {slug} = args;

	if (slug === "pages") {
		return (args: AccessArgs): AccessResult => {
			const {req} = args;
			const {user} = req;
			if (user?.role === "admin") return true;
			if (!user) {
				return {
					and: [
						{
							_status: {
								equals: "published",
							},
						},
						{
							or: [
								{
									locked: {
										not_equals: true,
									},
								},
								{
									locked: {
										exists: false,
									},
								},
								{
									authority: {
										exists: false,
									},
								},
								{
									and: [
										{
											locked: {
												equals: true,
											},
										},
										{
											authority: {
												less_than: 1,
											},
										},
									],
								},
							],
						},
					],
				};
			}
			const authorized =
				(user?.role && roleToAuthority(user.role as RP_Roles)) || 0;
			const finalRead: Where & { or: Where[] } = {
				or: [
					{
						and: [
							{
								_status: {
									equals: "published",
								},
							},

							{
								or: [
									{
										locked: {
											not_equals: true,
										},
									},
									{
										locked: {
											exists: false,
										},
									},
									{
										authority: {
											exists: false,
										},
									},
									{
										and: [
											{
												locked: {
													equals: true,
												},
											},
											{
												or: [
													{
														authority: {
															less_than: authorized + 1,
														},
													},
													{
														allowList: {
															contains: user?.id,
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			};
			return finalRead;
		};
	} else {
		return (args: AccessArgs): AccessResult => {
			const {req} = args;
			const {user} = req;
			if (user?.role === "admin") return true;
			if (user?.role === "editor") {
				return true;
			}
			const authorized =
				(user?.role && roleToAuthority(user.role as RP_Roles)) || 0;
			const finalRead: Where & { or: Where[] } = {
				or: [
					{
						and: [
							{
								_status: {
									equals: "published",
								},
							},
							{
								or: [
									{
										locked: {
											exists: false,
										},
									},
									{
										locked: {
											equals: false,
										},
									},
									{
										and: [
											{
												locked: {
													equals: true,
												},
											},
											{
												or: [
													{
														allowList: {
															contains: user?.id,
														},
													},
													{
														authority: {
															less_than_equal: authorized,
														},
													},
												],
											},
										],
									},
								],
							},
						],
					},
				],
			};
			return finalRead;
		};
	}
};
const standardLockedReadAccess = (args: { slug: CollectionSlug }): Access => {
	const {slug} = args;
	return (args: AccessArgs): AccessResult => {
		const {req} = args;
		const {user} = req;
		if (!user)
			return {
				and: [
					{
						_status: {
							equals: "published",
						},
					},
					{
						or: [
							{
								locked: {
									not_equals: true,
								},
							},
							{
								and: [
									{
										locked: {
											equals: true,
										},
									},
									{
										or: [
											{
												authority: {
													less_than: 1,
												},
											},
										],
									},
								],
							},
						],
					},
				],
			};

		if (user?.role === "admin") return true;
		if (user?.role === "editor") {
			return true;
		}
		const authorized =
			(user?.role && roleToAuthority(user.role as RP_Roles)) || 0;

		const reader: Where & { or: Where[] } = {
			or: [
				{
					and: [
						{
							_status: {
								equals: "published",
							},
						},
						{
							or: [
								{
									locked: {
										not_equals: true,
									},
								},

								{
									and: [
										{
											locked: {
												equals: true,
											},
										},
										{
											or: [
												{
													authority: {
														less_than: authorized + 1,
													},
												},
												{
													allowList: {
														contains: user?.id,
													},
												},
											],
										},
									],
								},
							],
						},
					],
				},
			],
		};
		if (user?.role === "author") {
			reader.or.push({
				author: {
					equals: user?.id,
				},
			});
		}
		return reader;
	};
};
const lockedReadAccess = (args: { collection: CollectionConfig }): Access => {
	const {collection} = args;
	if ("author" in collection.fields) {
		return standardLockedReadAccess({
			slug: collection.slug as CollectionSlug,
		});
	} else {
		return authorlessLockedReadAccess({
			slug: collection.slug as CollectionSlug,
		});
	}
};

export const lockCollections = (
	collections: CollectionConfig[],
	pluginOptions: LockerPluginConfig,
): void => {
	const collectionConfigs = [...(collections || [])];
	// Get or create users collection
	const targetCollectionSlugs = [...(pluginOptions.targetCollections || [])];

	if (!targetCollectionSlugs.some((slug) => slug === "pages")) {
		targetCollectionSlugs.push("pages");
	}

	targetCollectionSlugs.forEach((slug) => {
		const collection = collectionConfigs?.find((c) => c.slug === slug);
		if (collection) {
			const {mergedFields, restFields} = mergeFields({
				path: collection.slug,
				baseFields: [
					lockBoxField({
						collection: collection.slug as CollectionSlug,
					}),
					allowListField({
						collection: collection.slug as CollectionSlug,
					}),
					authorityField({
						collection: collection.slug as CollectionSlug,
					}),
				],
				patchFields: collection.fields,
			});
			collection.fields = [...restFields, ...mergedFields];
		}
	});
};
