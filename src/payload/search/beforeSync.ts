import { Category, Search, Tag } from "@/payload-types";
import { CatOverview } from "@collections/Deltas/delta-types";
import { P_Tag } from "@collections/Tags";
import type { BeforeSync, DocToSync } from "@payloadcms/plugin-search/types";
import { CollectionSlug, DataFromCollectionSlug } from "payload";
import { nanoid } from "nanoid";

export type IndexedCollections = Extract<
  CollectionSlug,
  Search["doc"]["relationTo"]
>;

type SearchDraft = Omit<Search, "id" | "updatedAt" | "createdAt" | "doc"> & {
  doc: {
    relationTo: IndexedCollections;
    value: string;
  };
};
export const beforeSyncWithSearch: BeforeSync = async (
  args
): Promise<DocToSync> => {
  const { originalDoc: targetDoc, searchDoc: searchDraft, payload, req } = args;
  const {
    doc: { relationTo }
  } = searchDraft;
  const collection = relationTo as IndexedCollections;
  const baseDraft: SearchDraft = {
    locked: false,
    allowList: null,
    tags: null,
    category: undefined,
    slug: "",
    meta: {
      image: null,
      description: null,
      title: null
    },
    authority: 0,
    author: [],
    doc: {
      relationTo: collection,
      value: searchDraft.doc.value as string
    }
  };
  const dothis = async () => {
    const constructDraft = <
      T extends Exclude<IndexedCollections, "users" | "categories" | "tags">
    >(
      collection: T,
      doc: Parameters<BeforeSync>[0]["originalDoc"]
    ) => {
      const document = doc as DataFromCollectionSlug<
        Exclude<IndexedCollections, "users" | "categories" | "tags">
      >;
      return {
        ...baseDraft,
        meta: {
          ...(("meta" in document && document.meta) || {})
        },
        title: document.title,
        slug: document.slug,
        locked: document.locked,
        authority: document.authority || 0,
        allowList:
          document.allowList && Array.isArray(document.allowList)
            ? document.allowList.map((r) =>
                typeof r === "string"
                  ? { allowListId: r, id: nanoid(24) }
                  : { allowListId: r.id, id: nanoid(24) }
              )
            : null,
        author:
          "author" in document && document.author
            ? [{ authorId: document.author as string, id: nanoid(24) }]
            : []
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
        const categorie = d.category as CatOverview;
        if (categorie && categorie.id) {
          baseDraft.category = {
            categoryKey: categorie.id,
            categorySlug: categorie.slug,
            categoryTitle: categorie.title
          };
        }
      }
    }

    if ("tags" in targetDoc) {
      const d = targetDoc as Extract<
        DataFromCollectionSlug<IndexedCollections>,
        {
          tags?: (string | Tag)[] | null;
        }
      >;
      const tags = d.tags as P_Tag[] | null | undefined;
      if (Array.isArray(tags) && tags.length > 0) {
        baseDraft.tags = tags.map((tag) => ({
          tagKey: tag.id,
          tagTitle: tag.title,
          weight: 1,
          id: nanoid(24)
        }));
      } else {
        baseDraft.tags = null;
      }
    }
    switch (collection) {
      case "users": {
        const document = targetDoc as DataFromCollectionSlug<"users">;
        return {
          ...baseDraft,
          locked: document.banned || false,
          title: document.name,
          slug: document.slug,
          author: [],
          allowList: null,
          tags: null,
          category: undefined,
          meta: {
            title: `@${document.slug}`,
            description: document.bio || "THE HIDEAWAY || " + document.name,
            image: null
          }
        };
      }
      case "tags": {
        const document = targetDoc as DataFromCollectionSlug<"tags">;
        return {
          ...baseDraft,
          author: document.author
            ? [{ authorId: document.author as string, id: nanoid(24) }]
            : [],
          title: document.title,
          slug: document.slug,
          tags: null,
          allowList: null,
          category: undefined,
          meta: {
            title: "#" + document.title,
            description: "Tagged : " + document.title,
            image: null
          }
        };
      }
      case "categories": {
        const document = targetDoc as DataFromCollectionSlug<"categories">;
        return {
          ...baseDraft,
          title: document.title,
          slug: document.slug,
          author: [],
          allowList: null,
          tags: null,
          category: undefined,
          meta: {
            title: document.title,
            description: "All entries in " + document.title,
            image: null
          }
        };
      }
      default: {
        return constructDraft(collection, targetDoc);
      }
    }
  };
  const finalDoc: DocToSync = (await dothis()) satisfies Omit<
    Search,
    "id" | "updatedAt" | "createdAt"
  >;

  // Ensure the main search document has a proper ID
  if (!finalDoc.id) {
    finalDoc.id = nanoid(24);
  }

  return {
    ...finalDoc,
    doc: {
      relationTo: collection as string,
      value: searchDraft.doc.value
    }
  } satisfies DocToSync;
};
