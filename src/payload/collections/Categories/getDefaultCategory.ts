"use server"
import {getPayload} from "@/lib/payload";
import {cache} from "react";

export const getDefaultCategory = cache(async () => {
	const payload = await getPayload();
	const category = await payload.find({
		collection: "categories",
		where: {
			slug: {
				like: "uncategorized"
			}
		},
		select: {
			title: true,
			slug: true
		}
	}).then(r => r.docs[0])
	if (!category) {
		return null;
	}
	return category;
})