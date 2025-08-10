import {getPayload} from "payload";
import configPromise from "@payload-config";
import {z} from "zod/v4";

export const tableSchema = async () => {
	const payload = await getPayload({config: configPromise});
	const categories = await payload.find({
		collection: "categories",
		limit: 100,
		overrideAccess: true,
		pagination: false,
		select: {
			title: true,
		},
	}).then((r) => {
		return r.docs.map((r) => r.title);
	}).catch((e) => {
		payload.logger.error(e);
		return [] as string[];
	});
	const tags = await payload.find({
		collection: "tags",
		pagination: false,
		select: {
			title: true,
		},
		overrideAccess: true,
		limit: 100,
	}).then((r) => r.docs.map((r) => r.title)).catch((e) => {
		payload.logger.error(e);
		return [] as string[];
	});

	return z.object({
		id: z.number(),
		title: z.string(),
		type: z.enum(["Delta", "Essay"]),
		category: z.enum(categories),
		createdAt: z.date(),
		updatedAt: z.date(),
		status: z.enum(["Published", "Draft"]),
		tags: z.array(z.enum(tags)).min(0).max(5),
	});
};
