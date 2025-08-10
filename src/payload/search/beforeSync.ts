import type {BeforeSync, DocToSync} from "@payloadcms/plugin-search/types";
import {CollectionSlug, DataFromCollectionSlug} from "payload";
import {merge} from "lodash-es";
import {Search} from "@/payload-types";

export type IndexedCollections = Extract<
	CollectionSlug,
	| "users"
	| "pages"
	| "posts"
	| "categories"
	| "tags"
	| "delta"
	| "playlists"
	| "albums"
	| "tracks"
>;

function slugToDoc<
	T extends Parameters<BeforeSync>["0"],
	U extends IndexedCollections,
>(c: T, d: U) {
	return c.originalDoc as DataFromCollectionSlug<U>;
}

export const beforeSyncWithSearch: BeforeSync = async (
	args,
): Promise<DocToSync> => {
	const {originalDoc, searchDoc, payload} = args;
	const {
		doc: {relationTo},
	} = searchDoc;
	const {slug, id, category, title, meta, owner} = originalDoc;

	const collection = relationTo as Search["doc"]["relationTo"];
	const {id: searchId, category: searchCategory, ...tos} = searchDoc;
	const modifiedDoc: DocToSync = {
		...tos,
		locked: false,

		allowList: null,
		image: null,

		slug: null,
		meta: {
			image: null,
			description: null,
			title: null,
		},
		category:
			searchCategory && searchCategory.length > 0
				? [
					{
						categoryId: searchCategory[0].categoryId,
						title: searchCategory[0].title,
						slug: searchCategory[0].slug,
					},
				]
				: null,
		tags: null,
		owner:
			owner && owner.length > 0
				? owner.map((r) => ({ownerId: r.ownerId}))
				: null,
		authority: 0,

		title: title ?? "",
	};
	const syncAccessLocker = (
		docToSync: DocToSync,
		ogDoc: DataFromCollectionSlug<IndexedCollections>,
	) => {
		const {slug} = ogDoc;
		let modDoc = {
			...docToSync,
		};

		if (collection === "users") {
			const uuser = ogDoc as DataFromCollectionSlug<"users">;
			const bane = uuser?.banned ?? false;
			modDoc = merge({}, modDoc, {
				locked: uuser?.banned ?? false,
				title: uuser.name,
				category: null,
				tags: null,
				slug,
				owner: [{ownerId: uuser.id}],
				//@TODO this needs an accommodating function to check the value for whether it is a number (\d\) or a url (/\)
				image:
					(uuser?.image && {
						reference: uuser.image,
						relationTo: "external",
					}) ||
					null,
				authority: bane ? 1000 : 0,
				allowList: null,
				meta: {
					image: null,
					description: uuser?.bio || "THE HIDEAWAY || " + uuser.name,
					title: `@${uuser.slug}`,
				},
			});
		}

		return {
			...modDoc,
			id,
			title,
		};
	};
	const docuMe = <T extends IndexedCollections>(
		a: T,
		b: { [key: string]: any },
	) => {
		return {
			...(b as DataFromCollectionSlug<T>),
			collection: a,
		} as DataFromCollectionSlug<T>;
	};
	const documentation = docuMe(collection, originalDoc);
	// if (collection === "users") {
	//   const uuser = documentation as DataFromCollectionSlug<"users">;
	//   const bane = uuser.banned ?? false;
	//   modifiedDoc.locked = bane;
	//   modifiedDoc.title = uuser.name ?? "NO NAME";
	//   modifiedDoc.category = null;
	//   modifiedDoc.tags = null;
	//
	//   modifiedDoc.slug = uuser.slug;
	//   modifiedDoc.owner = [{ ownerId: `${uuser.id}` }];
	//
	//   modifiedDoc.authority = bane ? 1000 : 0;
	//   modifiedDoc.allowList = null;
	//   modifiedDoc.meta = {
	//     image: null,
	//     description: uuser?.bio || "THE HIDEAWAY || " + uuser.name,
	//     title: `@${uuser.slug}`,
	//   };
	//   modifiedDoc.doc = {
	//     value: uuser.id,
	//     relationTo: "users",
	//   };
	//   return {
	//     allowList:
	//       modifiedDoc.allowList?.flatMap((r) =>
	//         r?.allowListId ? { allowListId: r.allowListId } : null,
	//       ) || null,
	//
	//     doc: modifiedDoc.doc,
	//     slug: modifiedDoc.slug,
	//     title: uuser.name ?? "NO NAME",
	//     priority: modifiedDoc.priority,
	//     image:
	//       (uuser?.image && [
	//         {
	//           reference: uuser.image,
	//           relationTo: "external",
	//         },
	//       ]) ||
	//       null,
	//     category: null,
	//     tags: null,
	//     owner: modifiedDoc.owner,
	//     locked: modifiedDoc.locked,
	//     authority: modifiedDoc.authority,
	//     meta: modifiedDoc.meta,
	//   };
	// }
	if ("locked" in documentation) {
		const {locked, authority: a, allowList: b} = documentation;
		modifiedDoc.locked = locked ?? false;
		if (locked) {
			modifiedDoc.authority = a ?? 1;
			modifiedDoc.allowList =
				b?.map((r) => ({
					allowListId: typeof r === "string" ? `${r}` : `${r.id}`,
				})) || null;
		}
	}
	if ("category" in documentation) {
		const {category} = documentation;
		const categoryID =
			typeof category === "string" ? category : (category?.id ?? null);
		const categoryTitle =
			(categoryID &&
				(await payload.findByID({
					collection: "categories",
					id: categoryID,
					overrideAccess: true,
					select: {
						title: true,
					},
				}).then((c) => c.title).catch(() => null))) ||
			null;
		modifiedDoc.category =
			categoryID && categoryTitle
				? [
					{
						categoryId: categoryID,
						title: categoryTitle,
					},
				]
				: null;
	} else {
		modifiedDoc.category = null;
	}
	if ("tags" in documentation) {
		const {tags} = documentation;
		const tagList = [] as { tagId: string; title: string }[];
		if (Array.isArray(tags)) {
			for (const tag of tags) {
				if (typeof tag === "string") {
					const tagID = tag;
					const tagTitle = await payload.findByID({
						collection: "tags",
						id: tagID,
						overrideAccess: true,
						select: {
							title: true,
						},
					}).then((c) => c.title || null).catch(() => null);
					if (tagTitle) {
						tagList.push({
							tagId: tagID,
							title: tagTitle,
						});
					}
				} else {
					tagList.push({
						tagId: tag.id,
						title: tag.title,
					});
				}
			}
		}
		modifiedDoc.tags = tagList.length > 0 ? tagList : null;
	}
	if ("author" in documentation) {
		const {author} = documentation;
		if (Array.isArray(author)) {
			const authorList = [] as { ownerId: string }[];
			for (const auth of author) {
				if (typeof auth === "string") {
					authorList.push({ownerId: `${auth}`});
				}
			}
			modifiedDoc.owner = authorList.length > 0 ? authorList : null;
		} else {
			const authorID =
				typeof author === "string" ? author : (author?.id ?? null);
			modifiedDoc.owner = authorID ? [{ownerId: `${authorID}`}] : null;
		}
	}
	if ("slug" in documentation) {
		const {slug} = documentation;
		modifiedDoc.slug = slug;
	}
	if ("title" in documentation) {
		const {title} = documentation;
		modifiedDoc.title = title ?? "NO TITLE";
	}

	return {
		slug: modifiedDoc.slug,
		title: modifiedDoc.title ?? "NO TITLE",
		image: modifiedDoc.image,
		category: modifiedDoc.category,
		tags: modifiedDoc.tags,
		owner: modifiedDoc.owner,
		locked: modifiedDoc.locked,
		authority: modifiedDoc.authority,
		meta: modifiedDoc.meta,

		doc: modifiedDoc.doc,
		allowList:
			modifiedDoc.allowList?.flatMap((r) =>
				r?.allowListId ? {allowListId: r.allowListId} : [],
			) || null,
	} as DocToSync;
};
