"use server";
import { draftMode } from "next/headers";
import { getPayload, Where } from "payload";
import configPromise from "@payload-config";
import { roleToAuthority } from "@/payload/plugins/locker/fields/authority/utils";
import { cache } from "react";
import {
  ArticleOverview,
  AuthorOverview,
  AuthorSingle,
  MediaReq,
  SingleArticle
} from "../../../../types/collections/posts";
import { authClient } from "@/lib/auth/client";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { getPostBookMarks } from "./getPostBookmarks";
import { Admin, Post, User } from "@/payload-types";
import {
  queryAuthorOverview,
  queryOverview,
  queryPostOverview
} from "./queryPostOverview";
import { CatOverview, TagOverview } from "@/types/collections/delta";
import {
  singlePostSelect,
  SinglePostKeys,
  SinglePostSelector,
  postOverviewSelect
} from "@/payload/collections/Posts/api/queryBase";
import { currentUser } from "@/lib/auth/context/servers";

export const queryAuthorsPost = cache(
  async ({
    slug,
    authorSlug
  }: {
    slug: string;
    authorSlug: string;
  }): Promise<{ post: SingleArticle } | null> => {
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
        collection: "posts",
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
        select: singlePostSelect
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
    const finalPost: SingleArticle = {
      ...post,
      author: null!,
      bookmarks: [] as string[],
      publishedAt: post.publishedAt,
      image: image,
      tagged: post?.tagged ? (post.tagged as TagOverview[]) : [],
      bookmarksCount: 0,
      slug: post.slug,
      category: post.category as { title: string; id: string; slug: string },
      queuedIDs: null!,
      relatedPosts: null!
    };
    const bookmarks = await getPostBookMarks({ id: `${post.id}` });
    if (bookmarks) {
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
        finalPost.relatedPosts = [];
        return {
          post: finalPost
        };
      }
    }
    const { queuedIDs, relatedPosts } = await queryRelatedPosts({
      postID: post.id,
      relatedPosts: post.relatedPosts,
      limit: 15,
      author,
      isAuthorPage: true
    });
    finalPost.queuedIDs = queuedIDs;
    finalPost.relatedPosts = relatedPosts;
    const { relatedPosts: __d, author: __, ...rest } = post;

    return {
      post: finalPost
    };
  }
);
export const queryPostBySlug = cache(
  async ({
    slug: sl
  }: {
    slug: string;
  }): Promise<{
    post: SingleArticle;
    prev: null | ArticleOverview;
    next: null | ArticleOverview;
  } | null> => {
    const { isEnabled: draft } = await draftMode();
    let slug = sl;
    if (sl.includes("+")) {
      const ss = sl.split("+")[0];
      ss && (slug = ss);
    }
    const payload = await getPayload({ config: configPromise });

    const select: SinglePostSelector = {
      title: true,
      subtitle: true,
      content: true,
      slug: true,
      id: true,

      relatedPosts: true,
      category: true,
      allowList: true,
      authority: true,
      author: true,
      publishedAt: true,
      locked: true,
      updatedAt: true,
      tagged: true,
      createdAt: true,
      image: true
    };

    const result = (await payload
      .find({
        collection: "posts",
        limit: 1,
        pagination: false,
        where: {
          slug: {
            equals: slug
          }
        },
        draft,
        overrideAccess: false,
        select,
        user: null
      })
      .catch((e) => {
        console.error({
          message: `Error while retrieving post by slug ${slug}`,
          error: e
        });
        return null;
      })) as {
      docs: Array<
        Pick<Post, Exclude<SinglePostKeys, "tags">> & {
          tagged: Array<TagOverview> | undefined | null;
        }
      >;
    };
    if (!result) {
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
    let image: MediaReq | null = post.image
      ? typeof post.image === "string"
        ? null
        : post.image
      : null;
    if (!image && typeof post.image === "string") {
      console.log("image searching", post.image);
      const img = await payload.findByID({
        collection: "userMedia",
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
        console.log("image found", img);
        image = img;
      }
    }
    const author: AuthorOverview | null = await payload
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
        } satisfies AuthorOverview;
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
    const finalPost: SingleArticle = {
      ...post,
      author,
      bookmarks: [] as string[],
      publishedAt: post.publishedAt,
      image: image,
      tagged: post.tagged || [],
      bookmarksCount: 0,
      slug: post.slug,
      category: post.category as { title: string; id: string; slug: string },
      queuedIDs: [],
      relatedPosts: [],
      disabled: false,
      content: post.content
    };
    const bookmarks = await getPostBookMarks({ id: `${post.id}` });
    if (bookmarks) {
      finalPost.bookmarks = bookmarks.bookmarks;
      finalPost.bookmarksCount = bookmarks.count;
    }

    // 3) Get the related posts

    const { queuedIDs, relatedPosts, prev, next } = await queryRelatedPosts({
      postID: post.id,
      relatedPosts: post.relatedPosts,
      limit: 5
    });
    finalPost.queuedIDs = queuedIDs;
    finalPost.relatedPosts = relatedPosts;
    const { relatedPosts: __d, author: __, ...rest } = post;

    return {
      post: finalPost,
      prev,
      next
    };
  }
);
export const queryPostByID = cache(
  async ({ id }: { id: string }): Promise<{ post: SingleArticle } | null> => {
    const payload = await getPayload({ config: configPromise });
    const post = await payload.findByID({
      collection: "posts",
      id,
      select: {
        slug: true
      }
    });
    if (!post || !post.slug) {
      return null;
    }
    return await queryPostBySlug({ slug: post.slug });
  }
);

export const queryRelatedPosts = cache(
  async ({
    postID,
    relatedPosts,
    limit = 2,
    author,
    isAuthorPage = false,
    user
  }: {
    postID: string;
    relatedPosts: Post["relatedPosts"];
    limit?: number;
    user?: string;
  } & (
    | {
        author?: string;
        isAuthorPage?: false;
      }
    | { isAuthorPage: true; author: string }
  )): Promise<{
    queuedIDs: string[];
    relatedPosts: ArticleOverview[];
    prev: ArticleOverview | null;
    next: ArticleOverview | null;
  }> => {
    //Now we first query for the posts to show in the "More Like This" sidebar
    const relatedPost: ArticleOverview[] = [];
    const isAuthorMode = isAuthorPage && author;
    const nextSlugs: string[] = [];
    const relatedIDs: string[] = [];
    const displayPostLimit = 5;
    const payload = await getPayload({ config: configPromise });
    const postDate = await payload.findByID({
      id: postID,
      collection: "posts",
      select: {
        updatedAt: true,
        publishedAt: true
      }
    });
    //1) We query for the IDs we got from related posts - sliced by (0,3)
    if (
      relatedPosts &&
      Array.isArray(relatedPosts) &&
      relatedPosts.length > 0
    ) {
      const ids = relatedPosts as string[];

      const directlyRelatedPosts = await queryOverview({
        params: {
          where: {
            id: {
              in: ids
            }
          },
          limit: displayPostLimit
        }
      })
        .then((r) => r.docs)
        .catch((r) => {
          console.error({
            message: `Error while retrieving related posts`,
            error: r
          });
          return null;
        });
      if (directlyRelatedPosts && directlyRelatedPosts.length > 0) {
        relatedPost.push(...directlyRelatedPosts);
        relatedIDs.push(...directlyRelatedPosts.map((r) => r.id));
      }
      if (relatedPost.length < displayPostLimit) {
        const smAnd: Where[] = [
          {
            id: {
              not_in: relatedIDs
            }
          }
        ];
        if (isAuthorMode) {
          smAnd.push({
            author: {
              equals: author
            }
          });
        }
        const relPosts = await queryOverview({
          params: {
            where: {
              and: smAnd
            },
            limit: displayPostLimit - relatedPost.length
          }
        })
          .then((r) => r.docs)
          .catch((r) => {
            console.error({
              message: `Error while retrieving related posts`,
              error: r
            });
            return null;
          });
        if (relPosts && relPosts.length > 0) {
          relatedPost.push(...relPosts);
          if (isAuthorMode) {
            relatedIDs.push(
              ...relPosts.flatMap((r) => {
                return r.author.id === author ? r.id : [];
              })
            );
          } else {
            relatedIDs.push(...relPosts.map((r) => r.id));
          }
        }
      }
    }

    if (relatedIDs.length < limit) {
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
      const queryLimit = (isAuthorMode ? 100 : limit) - relatedIDs.length;
      if (isAuthorMode) {
        and.push({
          author: {
            equals: author
          }
        });
      }
      const queuedPosts = await payload
        .find({
          collection: "posts",
          where: {
            and
          },
          limit: queryLimit,
          select: {
            slug: true
          }
        })
        .then((r) => r.docs)
        .catch((r) => {
          console.error({
            message: `Error while retrieving related posts`,
            error: r
          });
          return null;
        });
      if (queuedPosts && queuedPosts.length > 0) {
        relatedIDs.push(...queuedPosts.map((r) => r.id));
      }
    }

    let prev: ArticleOverview | null = null;
    let prevv = await payload
      .find({
        collection: "posts",
        where: {
          and: [
            {
              _status: {
                equals: "published"
              }
            },
            {
              id: {
                not_equals: postID
              }
            },
            {
              or: [
                {
                  publishedAt: {
                    greater_than: postDate.publishedAt || postDate.updatedAt
                  }
                },
                {
                  updatedAt: {
                    greater_than: postDate.updatedAt
                  }
                }
              ]
            }
          ]
        },
        limit: 1,
        pagination: false,
        select: postOverviewSelect
      })
      .then((r) => r.docs[0] || null)
      .then((r) =>
        r
          ? {
              ...r,
              tagged: (r.tagged || []) as TagOverview[],
              publishedAt: r.publishedAt as string,
              author: r.author as string,
              locked: r.locked || false,
              category: r.category as CatOverview
            }
          : null
      )
      .catch((r) => {
        payload.logger.error({
          message: `Error while retrieving related posts`,
          error: r
        });
        return null;
      });
    if (!prevv) {
      prevv = await payload
        .find({
          collection: "posts",
          where: {
            and: [
              {
                _status: {
                  equals: "published"
                }
              },
              {
                id: {
                  not_equals: postID
                }
              }
            ]
          },
          limit: 1,
          pagination: false,
          select: postOverviewSelect
        })
        .then((r) => r.docs[0] || null)
        .then((r) =>
          r
            ? {
                ...r,
                tagged: (r.tagged || []) as TagOverview[],
                publishedAt: r.publishedAt as string,
                author: r.author as string,
                locked: r.locked || false,
                category: r.category as CatOverview
              }
            : null
        )
        .catch((r) => {
          payload.logger.error({
            message: `Error while retrieving related posts`,
            error: r
          });
          return null;
        });
    }
    if (prevv) {
      const p = await queryAuthorOverview(prevv.author);
      let image: MediaReq | null = prevv.image
        ? typeof prevv.image === "string"
          ? null
          : prevv.image
        : null;
      if (!image && typeof prevv.image === "string") {
        const img = await payload.findByID({
          collection: "userMedia",
          id: prevv.image as string,
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
      if (p) {
        prev = {
          ...prevv,
          author: p,
          image,
          bookmarks: [],
          bookmarksCount: 0
        };
      }
    }
    let next: ArticleOverview | null = null;

    let nexx = await payload
      .find({
        collection: "posts",
        where: {
          and: [
            {
              _status: {
                equals: "published"
              }
            },
            {
              id: {
                not_equals: postID
              }
            },
            {
              or: [
                {
                  publishedAt: {
                    less_than: postDate.publishedAt
                  }
                },
                {
                  updatedAt: {
                    less_than: postDate.updatedAt
                  }
                }
              ]
            }
          ]
        },
        limit: 1,
        pagination: false,
        select: postOverviewSelect
      })
      .then((r) => r.docs[0] || null)
      .then((r) =>
        r
          ? {
              ...r,
              tagged: (r.tagged || []) as TagOverview[],
              publishedAt: r.publishedAt as string,
              author: r.author as string,
              locked: r.locked || false,
              category: r.category as CatOverview
            }
          : null
      )
      .catch((r) => {
        payload.logger.error({
          message: `Error while retrieving related posts`,
          error: r
        });
        return null;
      });
    if (!nexx) {
      nexx = await payload
        .find({
          collection: "posts",
          where: {
            and: [
              {
                _status: {
                  equals: "published"
                }
              },
              {
                id: {
                  not_in: [postID, ...((prev && [prev.id]) || [])]
                }
              }
            ]
          },
          limit: 1,
          pagination: false,
          select: postOverviewSelect
        })
        .then((r) => r.docs[0] || null)
        .then((r) =>
          r
            ? {
                ...r,
                tagged: (r.tagged || []) as TagOverview[],
                publishedAt: r.publishedAt as string,
                author: r.author as string,
                locked: r.locked || false,
                category: r.category as CatOverview
              }
            : null
        )
        .catch((r) => {
          payload.logger.error({
            message: `Error while retrieving related posts`,
            error: r
          });
          return null;
        });
    }
    if (nexx) {
      const p = await queryAuthorOverview(nexx.author);
      let image: MediaReq | null = nexx.image
        ? typeof nexx.image === "string"
          ? null
          : nexx.image
        : null;
      if (!image && typeof nexx.image === "string") {
        const img = await payload.findByID({
          collection: "media",
          id: nexx.image as string,
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
      if (p) {
        next = {
          ...nexx,
          author: p,
          image,
          bookmarks: [],
          bookmarksCount: 0
        };
      }
    }
    if (relatedPost.length > 0) {
    }
    return {
      queuedIDs: relatedIDs,
      relatedPosts: relatedPost,
      next,
      prev
    };
  }
);
