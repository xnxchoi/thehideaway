import {getPayload} from "payload";
import configPromise from "@payload-config";

import {cache} from "react";
import type {Media, User, UserMedia} from "@/payload-types";

export type UserQueryResult = Pick<
	User,
	| "bio"
	| "role"
	| "updatedAt"
	| "createdAt"
	| "email"
	| "id"
	| "slug"
	| "name"
	| "firstName"
	| "location"
	| "lastName"
	| "image"
	| "onboarded"
	| "banned"
> & {
	portrait: UserMedia | Media | null;
};
export const queryUserIDBySlug = cache(
	async ({
		userSlug,
	}: {
		userSlug: string;
	}): Promise<string | undefined | null> => {
		const payload = await getPayload({config: configPromise});
		const result = await payload.find({
			overrideAccess: true,
			collection: "users",
			limit: 1,
			depth: 1,
			where: {
				slug: {
					equals: userSlug,
				},
			},
		}).then((a) => a.docs[0]?.id ?? null).catch(() => null);
		return result;
	},
);
export const queryUserBySlug = cache(
	async ({
		userSlug,
	}: {
		userSlug: string;
	}): Promise<UserQueryResult | undefined | null> => {
		const payload = await getPayload({config: configPromise});
		const result = await payload.find({
			collection: "users",

			limit: 1,
			overrideAccess: true,
			pagination: false,
			where: {
				slug: {
					like: userSlug,
				},
			},
			select: {
				bio: true,
				role: true,
				updatedAt: true,
				createdAt: true,
				email: true,
				portrait: true,
				onboarded: true,
				banned: true,

				slug: true,
				name: true,
				firstName: true,
				location: true,
				lastName: true,
				image: true,
				id: true,
			},
		}).then((a) => a.docs[0] ?? null).catch(
			() => (console.error(`Error while retrieving user ${userSlug}`), null),
		);
		if (result) {
			const post = result;
			if (!post) return null;
			if (post.banned) {
				return null;
			}
			const returned: UserQueryResult = {
				...post,
				portrait: null,
			};
			if (post.portrait) {
				const portrait = await payload.findByID({
					collection: "userMedia",
					id: post.portrait,
					overrideAccess: true,
				});
				returned.portrait = portrait || null;
			}
			return returned;
		}
		return null;
	},
);
