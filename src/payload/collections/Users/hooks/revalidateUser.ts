"use server";
import type {
	CollectionAfterChangeHook,
	CollectionAfterDeleteHook
} from "payload";

import {revalidatePath, revalidateTag} from "next/cache";
import {User} from "@/payload-types";
import {cache} from "react";

export const revalidateUser: CollectionAfterChangeHook<User> = cache(
	async ({doc, previousDoc, operation, req}) => {
		const payload = req.payload;
		const context = req.context;
		if (operation === "update") {
			if (!context.disableRevalidate) {
				if (doc) {
					if (!doc.banned) {
						const path = `/users/${doc.slug}`;

						payload.logger.info(`Revalidating user at path: ${path}`);

						revalidatePath(path);
						revalidateTag("users-sitemap", {expire: 50});
					}

					// If the page was previously published, we need to revalidate the old path
					if (!previousDoc?.banned && doc?.banned) {
						const oldPath = `/users/${previousDoc.slug}`;

						payload.logger.info(`Revalidating old member at path: ${oldPath}`);

						revalidatePath(oldPath);
						revalidateTag("users-sitemap", {expire: 50});
					}
				}
			}
		}
		return doc;
	}
);

export const revalidateDelete: CollectionAfterDeleteHook<User> = async ({
	                                                                        doc,
	                                                                        req,
	                                                                        context
}) => {
	try {
		const overrideAccess = true;
		const payload = req.payload;
		await payload.delete({
			collection: "bookmarks",
			overrideAccess,
			where: {user: {equals: doc.id}},
			context: {
				...context,
				overrideAccess
			},
			req
		});
		await payload.delete({
			collection: "profile",
			overrideAccess: true,
			where: {author: {equals: doc.id}},
			context: {
				...context,
				overrideAccess
			},
			req
		});
		await payload.delete({
			collection: "follows",
			overrideAccess: true,
			where: {
				or: [{target: {equals: doc.id}}, {user: {equals: doc.id}}]
			},
			context: {
				...context,
				overrideAccess
			},
			req
		});
		if (!req.context?.disableRevalidate) {
			const path = `/users/${doc?.slug}`;
			revalidatePath(path);
			revalidateTag("users-sitemap", {expire: 50});
		}
	} catch (e) {
		req.payload.logger.error(e);
	}

	return doc;
};
