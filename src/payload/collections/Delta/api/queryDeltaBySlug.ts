"use server";
import {authClient} from "@/lib/auth/client";
import {type Delta} from "@/payload-types";
import {roleToAuthority} from "@/payload/plugins/locker/fields/authority/utils";
import {RP_Roles} from "@/stores/Notification/NotificationStore";
import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {SingleSurf, SurfOverview} from "@/types/collections/surf";
import {AuthorSingle} from "@/types/collections/users";
import configPromise from "@payload-config";
import {draftMode} from "next/headers";
import {getPayload, Payload, Where} from "payload";
import {cache} from "react";
import type {PostOverview} from "../../../../types/collections/posts";
import {getDeltaBookMarks} from "./getDeltaBookmarks";
import {queryOverview} from "./queryDeltaOverview";

export const queryAuthorsDelta = cache(
  async ({
    slug,
    authorSlug
  }: {
    slug: string;
    authorSlug: string;
  }): Promise<{ post: SingleSurf } | null> => {
    const { isEnabled: draft } = await draftMode();

    const payload = await getPayload({ config: configPromise });
    const user = await authClient.getSession();
    const se = user?.data?.user ?? null;
    const author = await payload
      .find({
        collection: "users",
        limit: 1,
        where: {
          slug: {
            equals: authorSlug
          }
        },
        overrideAccess: true,
        select: {
          slug: true
        }
      })
      .then((r) => {
        return r.docs[0]?.id ?? null;
      });
    if (!author) {
      return null;
    }
    const result = await payload
      .find({
        collection: "delta",
        draft,
        limit: 1,
        overrideAccess: true,
        pagination: false,
        where: {
          and: [
            {
              author: {
                equals: author
              }
            },
            {
              slug: {
                equals: slug
              }
            }
          ]
        },
        select: {
          title: true,
          content: true,
          slug: true,
          relatedDeltas: true,
          category: true,
          allowList: true,
          authority: true,
          author: true,
          publishedAt: true,
          source: true,
          tagged: true,
          locked: true,
          updatedAt: true,
          createdAt: true
        }
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving post by slug ${slug}`,
          error: e
        });
        return null;
      });
    if (!result || !result.docs || result.docs.length < 1) {
      return null;
    }
    // 1) Get the post
    const post = result.docs[0];
    if (!post) {
      return null;
    }
    // 2) Get the author info
    if (!post.author || !post?.slug || !post.publishedAt) {
      return null;
    }

    const finalPost: SingleSurf = {
      ...post,
      author: null!,
      bookmarks: [] as string[],
      source: post.source,
      publishedAt: post.publishedAt,
      bookmarksCount: 0,
      slug: post.slug,
      tagged: post.tagged ? (post.tagged as Array<TagOverview>) : [],
	    category: post.category as CategoryOverview,
      queuedIDs: null!,
      relatedDeltas: null!
    };
    const bookmarks = await getDeltaBookMarks({ payload, id: `${post.id}` });
    if (bookmarks instanceof Error) {
      console.error({
        message: `Error while retrieving bookmarks for post ${post.id}`,
        error: bookmarks
      });
      finalPost.bookmarks = [] as string[];
      finalPost.bookmarksCount = 0;
    } else {
      finalPost.bookmarks = bookmarks.bookmarks;
      finalPost.bookmarksCount = bookmarks.count;
    }
    const authorInfo: AuthorSingle | null = await payload
      .findByID({
        collection: "users",
        id: post.author as string,
        overrideAccess: true,
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
    //This is a rather draconian approach, but I'd like (for now) to not deal with "author may be undefined"
    if (!authorInfo) {
      return null;
    }
    finalPost.author = authorInfo;
    // 3) Get the related posts
    if (post.locked) {
      //We consider the default value to be 1, representing an authenticated user; otherwise locked is usesless as a property
      const auth = post.authority ?? 1;
      if (
        se &&
        se.id &&
        se.role &&
        (roleToAuthority(se.role as RP_Roles) >= auth ||
          post.allowList?.some(
            (r) => `${typeof r === "string" ? r : r.id}` === se.id
          ))
      ) {
        finalPost.content = post.content;
      } else {
        finalPost.content = {
          root: {
            type: "paragraph",
            children: [],
            direction: "ltr",
            format: "start",
            indent: 0,
            version: 0
          }
        };
        finalPost.disabled = true;
        finalPost.queuedIDs = [];
        finalPost.relatedDeltas = [];
        return {
          post: finalPost
        };
      }
    }
    const { queuedIDs, relatedDeltas } = await queryRelatedDeltas({
      payload,
      deltaID: post.id,
      relatedDeltas: post.relatedDeltas,
      limit: 15,
      author,
      isAuthorPage: true
    });
    finalPost.queuedIDs = queuedIDs;
    finalPost.relatedDeltas = relatedDeltas;
    const { relatedDeltas: __d, author: __, ...rest } = post;

    return {
      post: finalPost
    };
  }
);
export const queryDeltaBySlug = cache(
  async ({ slug }: { slug: string }): Promise<{ post: SingleSurf } | null> => {
    const { isEnabled: draft } = await draftMode();

    const payload = await getPayload({ config: configPromise });
    const user = await authClient.getSession();
    const se = user?.data?.user ?? null;

    const result = await payload
      .find({
        collection: "delta",
        draft,
        where: {
          slug: {
            equals: slug
          }
        },
        overrideAccess: true,
        limit: 1,
        pagination: false,
        select: {
          title: true,
          content: true,
          slug: true,
          tagged: true,
          relatedDeltas: true,
          category: true,
          allowList: true,
          authority: true,
          author: true,
          source: true,
          publishedAt: true,
          locked: true,
          updatedAt: true,
          createdAt: true
        }
      })
      .then((r) => {
        if (r.docs) {
          const doc = r.docs[0];
          return doc || null;
        }
        return null;
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving post by slug ${slug}`,
          error: e
        });
        return null;
      });
    if (!result) {
      return null;
    }
    // 1) Get the post
    const post = result;
    if (!post) {
      return null;
    }
    // 2) Get the author info
    if (!post.author || !post?.slug || !post.publishedAt) {
      return null;
    }

    const finalPost: SingleSurf = {
      ...post,
      author: null!,
      bookmarks: [] as string[],
      source: post.source,
      publishedAt: post.publishedAt,
      bookmarksCount: 0,
      slug: post.slug,
	    category: post.category as CategoryOverview,
      queuedIDs: null!,
      relatedDeltas: null!,
      tagged: post.tagged ? (post.tagged as Array<TagOverview>) : []
    };
    const bookmarks = await getDeltaBookMarks({ payload, id: `${post.id}` });
    if (bookmarks instanceof Error) {
      console.error({
        message: `Error while retrieving bookmarks for post ${post.id}`,
        error: bookmarks
      });
      finalPost.bookmarks = [] as string[];
      finalPost.bookmarksCount = 0;
    } else {
      finalPost.bookmarks = bookmarks.bookmarks;
      finalPost.bookmarksCount = bookmarks.count;
    }
    const author: AuthorSingle | null = await payload
      .findByID({
        collection: "users",
        id: post.author as string,
        overrideAccess: true,
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
    //This is a rather draconian approach, but I'd like (for now) to not deal with "author may be undefined"
    if (!author) {
      return null;
    }
    finalPost.author = author;
    // 3) Get the related posts

    const { queuedIDs, relatedDeltas } = await queryRelatedDeltas({
      payload,
      deltaID: post.id,
      relatedDeltas: post.relatedDeltas,
      limit: 15
    });
    finalPost.queuedIDs = queuedIDs;
    finalPost.relatedDeltas = relatedDeltas;
    const { relatedDeltas: __d, author: __, ...rest } = post;
    if (post.locked) {
      //We consider the default value to be 1, representing an authenticated user; otherwise locked is usesless as a property
      const auth = post.authority ?? 1;
      if (
        se &&
        se.id &&
        se.role &&
        (roleToAuthority(se.role as RP_Roles) >= auth ||
          post.allowList?.some(
            (r) => `${typeof r === "string" ? r : r.id}` === se.id
          ))
      ) {
        finalPost.content = post.content;
        finalPost.disabled = false;
      } else {
        finalPost.disabled = true;
        finalPost.content = {
          root: {
            type: "paragraph",
            children: [],
            direction: "ltr",
            format: "start",
            indent: 0,
            version: 0
          }
        };
        finalPost.queuedIDs = [];
        finalPost.relatedDeltas = [];
      }
    }
    return {
      post: finalPost
    };
  }
);
export const queryPostByID = cache(
  async ({ id }: { id: string }): Promise<{ post: SingleSurf } | null> => {
    const payload = await getPayload({ config: configPromise });
    const post = await payload.findByID({
      collection: "delta",
      id,
      select: {
        slug: true
      }
    });
    if (!post || !post.slug) {
      return null;
    }
    return await queryDeltaBySlug({ slug: post.slug });
  }
);

export const queryRelatedDeltas = cache(
  async ({
    payload,
    deltaID,
    relatedDeltas,
    limit = 15,
    author,
    isAuthorPage = false
  }: {
    payload: Payload;
    deltaID: string;
    relatedDeltas: Delta["relatedDeltas"];
    limit?: number;
  } & (
    | {
        author?: string;
        isAuthorPage?: false;
      }
    | { isAuthorPage: true; author: string }
  )): Promise<{
    queuedIDs: string[];
	  relatedDeltas: (SurfOverview | PostOverview)[];
  }> => {
    //Now we first query for the posts to show in the "More Like This" sidebar
	  const relatedItems: (SurfOverview | PostOverview)[] = [] as (
      | SurfOverview
		  | PostOverview
    )[];
    const relatedDeltasIDs: string[] = [];
    const isAuthorMode = isAuthorPage && author;
    const nextSlugs: string[] = [];
    const relatedIDs: string[] = [];
    const displayDeltaLimit = 5;
    //Query for a total of 3 posts
    //1) We query for the IDs we got from related posts - sliced by (0,3)
    if (
      relatedDeltas &&
      Array.isArray(relatedDeltas) &&
      relatedDeltas.length > 0
    ) {
      const ids = relatedDeltas.flatMap((r) => {
        const id =
          typeof r === "string"
            ? r
            : typeof r === "object" && r.value
              ? typeof r.value === "string"
                ? r.value
                : r.value.id
              : null;
        if (!id) return [];
        return id;
      });

      const directlyRelatedDeltas = await queryOverview({
        payload,
        params: {
          where: {
            id: {
              in: ids
            }
          },
          limit: displayDeltaLimit
        }
      });
      if (directlyRelatedDeltas && directlyRelatedDeltas.totalDocs > 0) {
        for (const r of directlyRelatedDeltas.docs) {
          relatedItems.push(r);
          relatedIDs.push(r.id);
        }
      }
      if (relatedItems.length < displayDeltaLimit) {
        const relDeltas = await queryOverview({
          payload,
          params: {
            where: {
              id: {
                not_in: relatedIDs
              }
            },
            limit: displayDeltaLimit - relatedDeltas.length
          }
        });
        if (relDeltas && relDeltas.docs && relDeltas.docs.length > 0) {
          for (const r of relDeltas.docs) {
            relatedItems.push(r);
            if (isAuthorMode) {
              if (r.author && r.author.id === author) {
                relatedIDs.push(r.id);
              }
            } else {
              relatedIDs.push(r.id);
            }
          }
        }
      }
    }
    if (relatedItems.length < limit) {
      const and: Where[] = [
        {
          _status: {
            equals: "published"
          }
        },
        {
          id: {
            not_in: relatedIDs
          }
        }
      ];
      let queryLimit = limit - relatedItems.length;
      if (isAuthorMode) {
        and.push({
          author: {
            equals: author
          }
        });
        queryLimit = 100 - relatedIDs.length;
      }
      const queuedDeltas = await payload.find({
        collection: "delta",
        where: {
          and: and
        },
        limit: queryLimit,
        select: {
          slug: true
        }
      });
      if (queuedDeltas && queuedDeltas.docs && queuedDeltas.docs.length > 0) {
        for (const r of queuedDeltas.docs) {
          relatedIDs.push(r.id);
        }
      }
    }
    return {
      queuedIDs: relatedIDs,
      relatedDeltas: relatedItems
    };
  }
);
