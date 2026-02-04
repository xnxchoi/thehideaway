import {getPayload} from "@/lib/payload";
import {Category, Profile, Search, Tag} from "@/payload-types";
import {BeforeSync, DocToSync} from "@/payload/plugins/plugin-search/types";
import {CategoryOverview} from "@/types/collections/meta-collections";
import {DataFromCollectionSlug} from "payload";
import {uuidv7} from "uuidv7";

export type IndexedCollections =
	Search["doc"]["relationTo"]

type SearchDraft = Omit<Search, "id" | "updatedAt" | "createdAt" | "doc"> & {
	doc: {
		relationTo: IndexedCollections;
		value: string;
	};
};
export const beforeSyncWithSearch: BeforeSync = async (
	args
): Promise<DocToSync> => {
	const {originalDoc: targetDoc, searchDoc: searchDraft, payload, req} = args;
	const {
		doc: {relationTo}
	} = searchDraft;
	const collection = relationTo as IndexedCollections;

	const baseDraft: SearchDraft = {
		locked: false,
		allowList: [],
		category: [],
		slug: "",
		meta: {
			image: undefined,
			description: undefined,
			title: undefined
		},
		authority: 0, tags: null,
		author: [], title: "", collection,
		doc: {
			relationTo: collection,
			value: searchDraft.doc.value as string
		}
	};
	const dothis = async () => {
		const constructDraft = async <
			T extends IndexedCollections
		>(
			collection: T,
			doc: Parameters<BeforeSync>[0]["originalDoc"]
		): Promise<DocToSync> => {
			const document = doc as DataFromCollectionSlug<T
			>;
			const payload = await getPayload()
			const author: Search["author"] = []
			if ("author" in document && document.author) {
				const au = await payload.findByID({
					collection: "users",
					id: typeof document.author === "string" ? document.author : document.author.id,
					select: {
						name: true,
						slug: true,
						image: true
					}
				})
				if (au) {
					author.push({
						key: au.id,
						name: au.name,
						slug: au.slug,
						id: uuidv7()
					})
				}
			}
			return {
				...baseDraft,
				meta: {
					...(("meta" in document && document.meta) || {})
				},
				title: document.title,
				slug: document.slug,
				locked: typeof document.locked === "boolean" ? document.locked : false,
				authority: document.authority || 0,
				allowList:
					document.allowList && Array.isArray(document.allowList)
						? document.allowList.map((r) =>

							({key: typeof r === "string" ? r : r.id, id: uuidv7()})
						)
						: [],
				author
			};
		};
		if ("category" in targetDoc) {
			const d = targetDoc as Extract<
				DataFromCollectionSlug<IndexedCollections>,
				{
					category: string | Category;
				}
			>;
			if (d && d.category) {
				const categorie = d.category as CategoryOverview;
				if (categorie && categorie.id) {
					baseDraft.category = [{
						id: uuidv7(),
						key: categorie.id,
						slug: categorie.slug,
						title: categorie.title
					}]
				}
			}
		}

		if ("tagged" in targetDoc) {
			const d = targetDoc as Extract<
				DataFromCollectionSlug<IndexedCollections>,
				{
					tagged?: (string | Tag)[] | null;
				}
			>;
			const tags: Array<{
				id: string;
				key: string;
				title: string;
				slug: string;
			}> = []
			if (!!d.tagged && Array.isArray(d.tagged) && d.tagged.length > 0) {
				const rP = d.tagged.map((tag) =>
					(typeof tag === "string" ? tag : tag.id)
				).map(async (id) => {
					return payload.findByID({
						collection: "tags",
						id,
						select: {
							id: true,
							title: true,
							slug: true
						}
					})
				})
				const tagP = await Promise.allSettled(rP).then(r => r.map(v => v.status === "fulfilled" ? v.value : null).filter(x => x !== null))
				tags.push(...(tagP.map(r => ({
					id: uuidv7(),
					key: r.id,
					title: r.title,
					slug: r.slug
				}))))
			}
			if (tags.length > 0) {
				baseDraft.tags = tags;
			}
		}
		switch (collection) {
			case "profile": {
				const document = targetDoc as Profile;
				return {
					...baseDraft,
					locked: typeof document.locked === "boolean" ? document.locked : false,

					title: document.title,
					slug: document.slug,
					author: [],
					authority: document.authority || 0,
					allowList:
						document.allowList && Array.isArray(document.allowList)
							? document.allowList.map((r) =>

								({key: typeof r === "string" ? r : r.id, id: uuidv7()})
							)
							: [],

					category: [],
					meta: {
						title: `@${document.slug}`,
						description: document.title,
						image: null
					}
				}
			}

			default: {
				return await constructDraft(collection, targetDoc);
			}
		}
	};
	const finalDoc: DocToSync = (await dothis())

	// Ensure the main search document has a proper ID
	if (!finalDoc.id) {
		finalDoc.id = uuidv7()
	}

	return {
		...finalDoc,
		doc: {
			relationTo: collection,
			value: searchDraft.doc.value
		}
	} satisfies DocToSync;
};
