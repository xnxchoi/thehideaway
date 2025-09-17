'use server'
import {CitationRange, ProcessedRangy} from "@/components/UX/Highlightr/types";
import {queryAuthorOverview} from "@collections/Posts/api/queryPostOverview";
import {HighlightColors} from "@/components/UX/Highlightr/stores";
import {BasePayload, getPayload, PayloadRequest, RequestContext} from "payload";
import configPromise from '@payload-config'
import {HighlightsCollection} from "@/components/UX/Highlightr/provider";
import {cache} from "react";

export const queryCitations=cache(async ({id,collection, userId}: {collection:HighlightsCollection; id: string; userId: string;  }) =>{
const config = await configPromise;
const payload = await getPayload({config})
	const cites = await payload.find({
		collection: "citations", where: {
			and: [{
				"target.value": {
					equals: id,
				},
			}, {
				author: {
					equals: userId
				},
			},],
		}, select: {
			selection: true,
			private: true,
			reference: true,
			color: true,
			createdAt: true,
			quote: true,
			author: true,
			path: true,
			memo: true,
			updatedAt: true,
			cited: true,
		}, overrideAccess: true, limit: 100,

		pagination: false, sort: "-createdAt",
	}).then((r) => r.docs || ([] as CitationRange[]));

	const citations: ProcessedRangy[] = [];
	const re = cites.flatMap((cite) => {
		if (!cite.selection.text) return [];
		return queryAuthorOverview(cite.author as string).then((author) => {
			if (!author) throw new Error("Author not found");
			return {
				selection: {
					before: cite.selection.before, text: cite.selection.text, after: cite.selection.after,
				},
				author,
				cited: cite.cited as string,
				quote: cite.quote,
				updatedAt: cite.updatedAt,
				id: cite.id,
				color: cite.color as HighlightColors,
				path: cite.path,
				reference: cite.reference,
				private: cite.private || false,
				createdAt: cite.createdAt,
				memo: cite.memo || null,
			}
		})
	});
	const rr = await Promise.allSettled(re)
	rr.forEach((r) => {
		if (r.status === "fulfilled") {
			citations.push(r.value);
		} else {
			payload.logger.error(r.reason,
				`Error fetching citations for ${collection} id: ${id} with user ${userId}`,);
		}
	})
	return citations;
});