import { getPayload, PaginatedDocs, Payload, Where } from "payload";

import configPromise from "@payload-config";
import { DeltaSelect, PostsSelect } from "@/payload-types";

import type {
  ReqDelta,
  DeltaOverview,
  TagOverview,
  CatOverview
} from "../../../../types/collections/delta";
import { cache } from "react";
import { getDeltaBookMarks } from "./getDeltaBookmarks";
import type {
  AuthorOverview,
  AuthorSingle
} from "../../../../types/collections/posts";

/**
 * @param limit - The number of posts to return
 * @param page - The page number to return
 * @param where - The where clause to filter the posts
 * @param sort - The sort clause to sort the posts
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export type QueryPostOverviewParams = {
  limit?: number;
  page?: number;
  where?: Where;
  sort?: string;
  overrideAccess?: boolean;
  select?: PostsSelect;
};
/**
 * A wrapper function to streamline the querying process.
 * 1) We query for the latest posts
 * 2) For each returned post, we query for the author info - label, name and slug
 * 3) We return the posts with the author info
 * @param limit - The number of posts to return; default 10
 * @param page - The page number to return; default 1
 * @param where - The where clause to filter the posts; default empty
 * @param sort - The sort clause to sort the postsl; default descending by published date
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export const queryPostOverview = cache(
  async ({
    limit = 10,
    page = 1,
    where = {},
    sort = "-publishedAt",
    overrideAccess = true,
    select = {}
  }: QueryPostOverviewParams): Promise<DeltaOverview[]> => {
    // 1) Get the payload instance
    const payload = await getPayload({ config: configPromise });
    const baseSelect: DeltaSelect = {
      title: true,
      publishedAt: true,
      image: true,
      subtitle: true,
      slug: true,
      author: true,
      locked: true,
      category: true,

      ...select
    };
    // 2) Query for the posts
    return await queryOverview({
      payload,
      params: { limit, page, where, sort, overrideAccess, select: baseSelect }
    }).then((posts) => posts.docs);
  }
);

/**
 * A wrapper function to streamline the querying process.
 * 1) We query for the latest posts
 * 2) For each returned post, we query for the author info - label, name and slug
 *  todo merge the query into one by setting defaultPopulate config on the members collection
 *
 * 3) We return the posts with the author info
 * @param limit - The number of posts to return; default 10
 * @param page - The page number to return; default 1
 * @param where - The where clause to filter the posts; default empty
 * @param sort - The sort clause to sort the postsl; default descending by published date
 * @param overrideAccess - Whether to override the access control, default true
 * @param select - The select clause to select the posts
 */
export const paginatedPosts = async (
  params: QueryPostOverviewParams
): Promise<PaginatedDocs<DeltaOverview>> => {
  // 1) Get the payload instance
  const payload = await getPayload({ config: configPromise });
  return queryOverview({ payload, params });
};

type OveerViewParams = { payload: Payload; params: QueryPostOverviewParams };
export const queryOverview = cache(
  async ({
    payload,
    params: {
      limit = 10,
      page = 1,
      where = {},
      sort = "-publishedAt",
      overrideAccess = true,
      select = {}
    }
  }: OveerViewParams): Promise<PaginatedDocs<DeltaOverview>> => {
    const baseWhere: Where & { and: Where[] } = {
      and: [
        {
          _status: {
            equals: "published"
          }
        }
      ]
    };
    for (const [key, value] of Object.entries(where)) {
      if (key === "and") {
        baseWhere.and.push(...(value as Where[]));
      } else if (key === "or") {
        baseWhere.and.push({
          or: (value as Where[]).map((w) => ({
            ...w
          }))
        });
      } else {
        baseWhere.and.push({ [key]: value });
      }
    }
    const baseSelect: DeltaSelect = {
      title: true,
      publishedAt: true,
      image: true,
      subtitle: true,
      slug: true,
      tagged: true,
      updatedAt: true,
      author: true,
      locked: true,
      category: true,
      ...select
    };
    // 2) Query for the deltas
    const foundDeltas: PaginatedDocs<ReqDelta> = (await payload
      .find({
        collection: "delta",
        limit,
        page,
        where: baseWhere,
        sort,
        overrideAccess,
        select: baseSelect
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving delta overview`,
          error: e
        });
        return {
          docs: [],
          totalDocs: 0,
          totalPages: 0,
          page: 0,
          hasNextPage: false,
          hasPrevPage: false,
          nextPage: 0,
          prevPage: 0,
          pagingCounter: 0,
          limit: 0
        };
      })) as PaginatedDocs<ReqDelta>;
    // 3) For each delta, query for the author info
    const deltas: DeltaOverview[] = (await Promise.all(
      foundDeltas.docs.flatMap(async (delta) => {
        const authorID = delta.author;
        if (!authorID || typeof authorID !== "string") {
          return [];
        }
        const author = await payload
          .findByID({
            collection: "users",
            id: authorID,
            select: {
              name: true,
              slug: true,
              displayUsername: true
            }
          })
          .then((r) => {
            return {
              ...r,
              displayUsername: r.displayUsername ?? r.name
            } as AuthorOverview;
          })
          .catch((e) => {
            console.error({
              message: `Error while retrieving author info`,
              error: e
            });
            return null;
          });
        if (!author) {
          return [];
        }
        const bookmarks = await getDeltaBookMarks({
          payload,
          id: `${delta.id}`
        });
        const finalDelta: DeltaOverview = {
          ...delta,
          author: author,
          category: delta.category as CatOverview,
          tagged: delta.tagged ? (delta.tagged as Array<TagOverview>) : [],
          ...(bookmarks instanceof Error
            ? { bookmarks: [] as string[], bookmarksCount: 0 }
            : {
                bookmarks: bookmarks.bookmarks,
                bookmarksCount: bookmarks.count
              })
        };
        return finalDelta;
      })
    )) as DeltaOverview[];
    const { docs: _, ...rest } = foundDeltas;
    return {
      docs: deltas,
      ...rest
    };
  }
);
