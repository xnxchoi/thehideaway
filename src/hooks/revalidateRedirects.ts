"use server";
import {updateTag} from "next/cache";
import type {CollectionAfterChangeHook} from "payload";

export const revalidateRedirects: CollectionAfterChangeHook = async ({
	                                                                     doc,
	                                                                     req: {payload}
                                                                     }) => {
	payload.logger.info(`Revalidating redirects`);

	updateTag("redirects");

	return doc;
};
