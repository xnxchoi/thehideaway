import {User} from "@/payload-types";

import {revalidatePath, revalidateTag} from "next/cache";
import type {CollectionAfterChangeHook, CollectionAfterDeleteHook} from "payload";
import {cache} from "react";

export const revalidateUser: CollectionAfterChangeHook<User> = cache(
	async ({doc, previousDoc, operation, req}) => {
		const payload = req.payload;
		const context = req.context;

		if (doc) {

			if (operation === "update") {
				const prev = previousDoc.slug || "";
				if (prev !== doc.slug) {
					const profil = await payload.find({
						collection: "profile",
						where: {
							author: {
								equals: doc.id
							}
						},
						pagination: false,
						limit: 1,
						select: {
							slides: true,
							_status: true,
							allowList: true, title: true,
							locked: true
						}, req
					}).then(r => r.docs[0] || false);
					if (profil) {
						await payload.update({
							collection: "profile",
							where: {
								author: {
									equals: doc.id
								}
							},
							data: {
								...profil,
								author: doc.id,
								title: doc.slug,
							}
						})
					}
				}
				if (!context.disableRevalidate) {
					if (!doc.banned) {
						const path = `/users/${doc.slug}`;

						payload.logger.info(`Revalidating user at path: ${path}`);

						revalidatePath(path);
						revalidateTag("users-sitemap");
						revalidateTag("user-" + doc.slug);
					}

					// If the page was previously published, we need to revalidate the old path
					if (!previousDoc?.banned && doc?.banned) {
						const oldPath = `/users/${previousDoc.slug}`;

						payload.logger.info(`Revalidating old member at path: ${oldPath}`);

						revalidatePath(oldPath);
						revalidateTag("users-sitemap");
						revalidateTag("user-" + previousDoc.slug);
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
			revalidateTag("users-sitemap");
			revalidateTag("user-" + doc?.slug);
		}
	} catch (e) {
		req.payload.logger.error(e);
	}

	return doc;
};
