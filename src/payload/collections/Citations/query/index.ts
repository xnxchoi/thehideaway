"use server";
import {
	CitationRange,
	HighlightsCollectionSlug,
	ProcessedRangy
} from "@/components/UX/Highlightr/types";
import {getUserOverview} from "@/payload/collections/Posts/api/queryPostOverviews";
import configPromise from "@payload-config";
import {getPayload} from "payload";
import {cache} from "react";

export const queryCitations = cache(
	async ({
		       id,
		       collection,
		       userId
	       }: {
		collection: HighlightsCollectionSlug;
		id: string;
		userId: string;
	}) => {
		const config = await configPromise;
		const payload = await getPayload({config});
		const cites = await payload
			.find({
				collection: "citations",
				where: {
					and: [
						{
							"target.value": {
								equals: id
							}
						},
						{
							author: {
								equals: userId
							}
						}
					]
				},
				select: {
					selection: true,
					private: true,
					reference: true,
					color: true,
					createdAt: true,
					quote: true,
					target: true,
					author: true,
					path: true,
					memo: true,
					updatedAt: true,
					cited: true
				},
				overrideAccess: true,
				limit: 100,

				pagination: false,
				sort: "-createdAt -updatedAt"
			})
			.then((r) => r.docs || ([] as CitationRange[]));

		const citations: ProcessedRangy[] = [];
		const existingCites = cites.filter((cite) =>
			("text" in cite.selection) && typeof cite.selection.text === "string" && cite.selection.text.trim().length > 0);

		const authors = existingCites.map(async cite => getUserOverview(typeof cite.author === "string" ? cite.author : cite.author.id).then(res => ({
			...cite,
			author: res
		})));
		const authorRes = await Promise.allSettled(authors);
		authorRes.forEach(r => {
			if (r.status === "fulfilled") {

				citations.push({
					...r.value,
					cited: typeof r.value.cited === "string" ? r.value.cited : r.value.cited.id,
					target: {
						relationTo: r.value.target.relationTo,
						value: typeof r.value.target.value === "string" ? r.value.target.value : r.value.target.value.id
					}
				})
			} else {
				payload.logger.error(
					r.reason,
					`Error fetching citations for ${collection} id: ${id} with user ${userId}`
				);
			}
		});
		return citations;
	}
);
