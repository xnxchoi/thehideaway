"use server";
import type {CollectionAfterChangeHook} from "payload";

import {revalidatePath, revalidateTag} from "next/cache";
import {Profile, User} from "@/payload-types";

export const revalidateProfile: CollectionAfterChangeHook<Profile> = async ({
	                                                                            doc,
	                                                                            previousDoc,
	                                                                            req
}) => {
	const context = req.context;
	const payload = req.payload;
	if (!context.disableRevalidate) {
		const author = doc?.author as User["id"];
		if (!author) {
			payload.logger.error(
				`Error revalidating profile, could not find author in doc ${doc.id}`
			);
			return doc;
		}
		try {
			const user = await payload.findByID({
				collection: "users",
				id: author,
				select: {
					slug: true,
					banned: true
				},
				overrideAccess: true,
				req,
				context: {
					...req.context,
					overrideAccess: true
				}
			});

			if (doc._status === "published" && !user?.banned) {
				const path = `/users/${user?.slug}`;

				payload.logger.info(`Revalidating profile link at path: ${path}`);

				revalidatePath(path);

				revalidateTag("users-sitemap", {expire: 50});
			}

			// If the post was previously published, we need to revalidate the old path
			if (previousDoc._status === "published" && doc._status !== "published") {
				const oldPath = `/users/${user?.slug}`;

				payload.logger.info(
					`Revalidating old profile link at path: ${oldPath}`
				);

				revalidatePath(oldPath);
				revalidateTag("users-sitemap", {expire: 50});
			}
		} catch (e) {
			console.error(e);
			return doc;
		}
	}
	return doc;
};
