"use server";
import {
	CitationRange,
	HighlightsCollectionSlug,
	ProcessedRangy
} from "@/components/UX/Highlightr/types";
import {getUserOverview} from "@/payload/collections/Posts/api/queryPostOverviews";
import configPromise from "@payload-config";
import {getPayload} from "payload";

export const queryCitations = async ({
	id,
	collection,
	userId
}: {
	collection: HighlightsCollectionSlug;
	id: string;
	userId: string;
}): Promise<ProcessedRangy[]> => {
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

	const validCites = cites.filter(
		(cite) =>
			"text" in cite.selection &&
			typeof cite.selection.text === "string" &&
			cite.selection.text.trim().length > 0
	);

	if (validCites.length === 0) return [];

	// All citations are filtered by author = userId, so there is only one author.
	// Fetch once rather than once per citation.
	const author = await getUserOverview(userId);

	const citations: ProcessedRangy[] = [];
	for (const cite of validCites) {
		try {
			citations.push({
				...cite,
				author,
				cited: typeof cite.cited === "string" ? cite.cited : cite.cited.id,
				target: {
					relationTo: cite.target.relationTo,
					value:
						typeof cite.target.value === "string"
							? cite.target.value
							: cite.target.value.id
				}
			});
		} catch (e) {
			payload.logger.error(
				e,
				`Error processing citation for ${collection} id: ${id} with user ${userId}`
			);
		}
	}
	return citations;
};
