import { getPayload } from "@/lib/payload";
import { Category, Post, Profile, Search } from "@/payload-types";
import { BeforeSync, DocToSync } from "@/payload/plugins/plugin-search/types";
import { calculateSearchScore } from "@/payload/search/calculateScore";
import { CategoryOverview } from "@/types/collections/meta-collections";
import { DataFromCollectionSlug } from "payload";
import { uuidv7 } from "uuidv7";

export type IndexedCollections = Search["doc"]["relationTo"];

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
    allowList: [],
    category: [],
    slug: "",
    meta: {
      image: undefined,
      description: undefined,
      title: undefined
    },
    authority: 0,
    tags: [],
    author: [],
    title: "",
    collection,
    doc: {
      relationTo: collection,
      value: searchDraft.doc.value as string
    }
  };
  const dothis = async () => {
    const constructDraft = async <T extends IndexedCollections>(
      collection: T,
      doc: Parameters<BeforeSync>[0]["originalDoc"]
    ): Promise<DocToSync> => {
      const document = doc as DataFromCollectionSlug<T>;
      const payload = await getPayload();
      const author: Search["author"] = [];
      if ("author" in document && document.author) {
        const aaaa = (
          Array.isArray(document.author) ? document.author : [document.author]
        ).map((r) => (typeof r === "string" ? r : r.id));

        const aus = await payload
          .find({
            collection: "users",
            pagination: false,
            where: {
              and: [
                {
                  id: {
                    in: aaaa
                  }
                },
                {
                  banned: {
                    equals: false
                  }
                }
              ]
            },
            select: {
              name: true,
              slug: true,
              image: true
            }
          })
          .then((r) => r.docs);
        author.push(
          ...aus.map((au) => ({
            key: au.id,
            name: au.name,
            slug: au.slug,
            id: uuidv7()
          }))
        );
      }
      return {
        ...baseDraft,
        meta: {
          ...(("meta" in document &&
            document.meta && {
              ...document.meta,
              image:
                (document.meta.image && {
                  relationTo: "media",
                  value:
                    typeof document.meta.image === "string"
                      ? document.meta.image
                      : document.meta.image.id
                }) ||
                undefined
            }) ||
            {})
        },
        title: document.title,
        slug: document.slug,
        locked: typeof document.locked === "boolean" ? document.locked : false,
        authority: document.authority || 0,
        allowList:
          document.allowList && Array.isArray(document.allowList)
            ? document.allowList.map((r) => ({
                key: typeof r === "string" ? r : r.id,
                id: uuidv7()
              }))
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
          baseDraft.category = [
            {
              id: uuidv7(),
              key: categorie.id,
              slug: categorie.slug,
              title: categorie.title
            }
          ];
        }
      }
    }

    if ("tagged" in targetDoc) {
      const d = targetDoc as Extract<
        DataFromCollectionSlug<IndexedCollections>,
        Pick<Post, "tagged">
      >;
      const tags: Array<{
        id: string;
        key: string;
        title: string;
        slug: string;
      }> = [];
      if (!!d.tagged && Array.isArray(d.tagged) && d.tagged.length > 0) {
        const rP = d.tagged
          .map((tag) => (typeof tag === "string" ? tag : tag.id))
          .map(async (id) => {
            return payload.findByID({
              collection: "tags",
              id,
              select: {
                id: true,
                title: true,
                slug: true
              }
            });
          });
        const tagP = await Promise.allSettled(rP).then((r) =>
          r
            .map((v) => (v.status === "fulfilled" ? v.value : null))
            .filter((x) => x !== null)
        );
        tags.push(
          ...tagP.map((r) => ({
            id: uuidv7(),
            key: r.id,
            title: r.title,
            slug: r.slug
          }))
        );
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
          locked:
            typeof document.locked === "boolean" ? document.locked : false,

          title: document.title,
          slug: document.slug,
          author: [],
          authority: document.authority || 0,
          allowList:
            document.allowList && Array.isArray(document.allowList)
              ? document.allowList.map((r) => ({
                  key: typeof r === "string" ? r : r.id,
                  id: uuidv7()
                }))
              : [],

          category: [],
          meta: {
            title: `@${document.slug}`,
            description: document.title,
            image: null
          }
        };
      }
      case "posts":
        return await constructDraft(collection, targetDoc).then((doe) => {
          const doc = targetDoc as Post;
          return {
            ...doe,
            meta: {
              ...doe.meta,
              image:
                (doc.image && {
                  relationTo: doc.image.relationTo,
                  value:
                    typeof doc.image.value === "string"
                      ? doc.image.value
                      : doc.image.value.id
                }) ||
                doe.meta?.image ||
                undefined,
              description: doc.subtitle
            }
          };
        });
      default: {
        return await constructDraft(collection, targetDoc);
      }
    }
  };
  const finalDoc: DocToSync = await dothis();

  // Ensure the main search document has a proper ID
  if (!finalDoc.id) {
    finalDoc.id = uuidv7();
  }

  // Calculate composite relevance score at index time
  const score = calculateSearchScore({
    priority: (searchDraft as any).priority ?? 0,
    createdAt: (targetDoc as any).createdAt ?? new Date().toISOString(),
    hasImage: !!(finalDoc.meta?.image),
    hasDescription: !!(finalDoc.meta?.description),
    hasTags: Array.isArray(finalDoc.tags) && finalDoc.tags.length > 0,
    hasCategory: Array.isArray(finalDoc.category) && finalDoc.category.length > 0
  });

  // DocToSync is Omit<Search,...>. `score` will be part of Search once types are
  // regenerated after the migration — cast is safe and intentional.
  return {
    ...finalDoc,
    score,
    collection,
    doc: {
      relationTo: collection,
      value: searchDraft.doc.value
    }
  } as DocToSync;
};
