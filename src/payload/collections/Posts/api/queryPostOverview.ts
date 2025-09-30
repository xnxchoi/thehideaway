"use server";
import { getPayload, PaginatedDocs, Where } from "payload";

import configPromise from "@payload-config";
import { PostsSelect } from "@/payload-types";
import {
  ArticleOverview,
  AuthorOverview,
  AuthorSingle,
  ReqArticle,
  type MediaReq
} from "../../../../types/collections/posts";
import { cache } from "react";
import { getPostBookMarks } from "./getPostBookmarks";
import type { TagOverview } from "../../../../types/collections/delta";

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
  sort?: string | string[];
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
export const queryPostOverview = async ({
  limit = 10,
  page = 1,
  where = {},
  sort = ["-updatedAt", "-publishedAt"],
  overrideAccess = true,
  select = {}
}: QueryPostOverviewParams): Promise<ArticleOverview[]> => {
  // 1) Get the payload instance
  const baseSelect: PostsSelect = {
    title: true,
    publishedAt: true,
    image: true,
    subtitle: true,
    slug: true,
    tags: true,
    author: true,
    locked: true,
    category: true,

    ...select
  };
  // 2) Query for the posts
  return await queryOverview({
    params: { limit, page, where, sort, overrideAccess, select: baseSelect }
  }).then((posts) => posts.docs);
};

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
): Promise<PaginatedDocs<ArticleOverview>> => {
  // 1) Get the payload instance
  return queryOverview({ params });
};

type OveerViewParams = { params: QueryPostOverviewParams };
export const queryOverview = cache(
  async ({
    params: {
      limit = 10,
      page = 1,
      where = {},
      sort = ["-updatedAt", "-publishedAt"],
      overrideAccess = true,
      select = {}
    }
  }: OveerViewParams): Promise<PaginatedDocs<ArticleOverview>> => {
    const payload = await getPayload({ config: configPromise });
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
    const baseSelect: PostsSelect = {
      title: true,
      publishedAt: true,
      image: true,
      subtitle: true,
      slug: true,
      author: true,
      allowList: true,
      authority: true,
      locked: true,
      category: true,
      id: true,
      updatedAt: true,
      tags: true,
      ...select
    };
    // 2) Query for the posts
    const foundPosts: PaginatedDocs<ReqArticle> = (await payload
      .find({
        collection: "posts",
        limit,
        page,
        where: baseWhere,
        sort,
        overrideAccess,
        select: baseSelect
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving post overview`,
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
      })) as PaginatedDocs<ReqArticle>;
    // 3) For each post, query for the author info
    const tg = foundPosts.docs.flatMap((post) => {
      const authorID = post.author as string;
      if (!authorID || typeof authorID !== "string") {
        return [];
      }
      return post as ReqArticle & { author: string };
    });
    const posts = await Promise.allSettled(
      tg.map(async (post) => {
        const author = await queryAuthorOverview(post.author);
        if (!author) {
          throw new Error("Author not found");
        }
        const bookmarks = await getPostBookMarks({ id: `${post.id}` });
        const finalPost: ArticleOverview = {
          ...post,
          author: author,
          category: post.category as {
            title: string;
            id: string;
            slug: string;
          },
          bookmarks: [],
          bookmarksCount: 0
        };
        if (bookmarks) {
          finalPost.bookmarks = bookmarks.bookmarks;
          finalPost.bookmarksCount = bookmarks.count;
        }
        return finalPost;
      })
    ).then((r) =>
      r.flatMap((r) => {
        if (r.status === "fulfilled") {
          return r.value as ArticleOverview;
        } else {
          return [];
        }
      })
    );

    return {
      ...foundPosts,
      docs: posts,
      totalDocs: posts.length
    };
  }
);
export const queryPostsByIDs = cache(
  async ({
    ids
  }: {
    ids: string[];
  }): Promise<PaginatedDocs<ArticleOverview>> => {
    const payload = await getPayload({ config: configPromise });
    const foundPosts = await payload
      .find({
        collection: "posts",
        where: {
          id: {
            in: ids
          }
        },
        select: {
          slug: true,
          title: true,
          publishedAt: true,
          updatedAt: true,
          image: true,
          subtitle: true,
          id: true,
          author: true,
          allowList: true,
          authority: true,
          tags: true,
          locked: true,
          category: true
        },
        overrideAccess: true
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving post overview`,
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
      });
    const posts: ArticleOverview[] = (await Promise.all(
      foundPosts.docs.flatMap(async (post) => {
        const authorID = post.author;
        if (!authorID || typeof authorID !== "string") {
          return [];
        }
        const author = await payload
          .findByID({
            collection: "users",
            overrideAccess: true,

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
            } as AuthorSingle;
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
        let image: MediaReq | null = post.image
          ? typeof post.image === "string"
            ? null
            : post.image
          : null;
        if (!image && typeof post.image === "string") {
          const img = await payload.findByID({
            collection: "media",
            id: post.image as string,
            overrideAccess: true,
            select: {
              url: true,
              darkmode: true,
              alt: true,
              caption: true,
              createdAt: true,
              updatedAt: true,
              filename: true,
              mimeType: true,
              size: true,
              width: true,
              height: true
            }
          });
          if (img) {
            image = img;
          }
        }
        const bookmarks = await getPostBookMarks({ id: `${post.id}` });
        const finalPost: ArticleOverview = {
          ...post,
          author: author,
          publishedAt: post.publishedAt ?? "",
          image,
          category: post.category as {
            title: string;
            id: string;
            slug: string;
          },
          tags: post.tags as TagOverview[],
          bookmarks: [],
          bookmarksCount: 0
        };
        if (bookmarks) {
          finalPost.bookmarks = bookmarks.bookmarks;
          finalPost.bookmarksCount = bookmarks.count;
        }
        return finalPost;
      })
    )) as ArticleOverview[];
    const { docs: _, ...rest } = foundPosts;
    return {
      docs: posts,
      ...rest
    };
  }
);
export const queryAuthorOverview = cache(async (authorID: string) => {
  const payload = await getPayload({ config: configPromise });
  return await payload
    .findByID({
      collection: "users",
      overrideAccess: true,
      id: authorID,
      select: {
        name: true,
        slug: true,
        image: true,
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
});
