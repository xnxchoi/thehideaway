"use server";
import { authClient } from "@/lib/auth/client";
import { Post } from "@/payload-types";
import {
  gatePostForUser,
  type GateResult
} from "@/components/UX/Paywall/gatePost";
import { getImageMedia } from "@/payload/collections/Posts/api/getImageMedia";
import {
  postOverviewSelect,
  SinglePostKeys,
  singlePostSelect
} from "@/payload/collections/Posts/api/queryBase";
import { roleToAuthority } from "@/payload/plugins/locker/fields/authority/utils";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { overviewSelectMap } from "@/types/collections/index";
import {
  CategoryOverview,
  categoryOverviewSelect,
  TagOverview,
  TagOverviewSelect,
  tagOverviewSelect
} from "@/types/collections/meta-collections";
import { AuthorOverview, userOverviewSelect } from "@/types/collections/users";
import { imageSelect } from "@/types/payload-api-selects";
import configPromise from "@payload-config";

import { draftMode } from "next/headers";
import {
  CollectionSlug,
  DataFromCollectionSlug,
  getPayload,
  Where
} from "payload";
import { cache } from "react";
import {
  FetchedPost,
  MediaReq,
  PostOverview,
  SingleArticle
} from "../../../../types/collections/posts";
import { getPostBookMarks } from "./getPostBookmarks";
import { getPostOverviews, getUserOverview } from "./queryPostOverviews";

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
        select: userOverviewSelect()
      })
      .then((r) => {
        return r.docs[0];
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
                equals: author.id
              }
            },
            {
              slug: {
                equals: slug
              }
            }
          ]
        },
        select: singlePostSelect()
      })
      .then((r) => {
        return r.docs[0];
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
    const { category: categoryd, id, slug: postSlug, publishedAt } = post;
    // 2) Get the author info
    if (!postSlug || !categoryd || !publishedAt) {
      return null;
    }
    const image = await getImageMedia({ post, payload });
    const category = await payload
      .findByID({
        collection: "categories",
        id: typeof categoryd === "string" ? categoryd : categoryd.id,
        select: overviewSelectMap.categories()
      })
      .catch((e) => {
        console.error("Error while retrieving category", e);
        return null;
      });
    if (!category) {
      return null;
    }
    const finalPost: SingleArticle = {
      ...post,
      author,
      authority: post.authority || 0,
      locked: post.locked || false,
      allowList:
        post?.allowList?.map((r) => {
          switch (typeof r) {
            case "string":
              return r;
            case "object":
              return r.id;
          }
        }) || ([] as string[]),
      bookmarks: [] as string[],
      publishedAt,
      image,
      tagged: post?.tagged ? (post.tagged as TagOverview[]) : [],
      bookmarksCount: 0,
      slug: post.slug,
      category,
      queuedIDs: null!,
      relatedPosts: null!
    };
    const bookmarks = await getPostBookMarks({ id: `${post.id}` });
    if (bookmarks) {
      finalPost.bookmarks = bookmarks.bookmarks;
      finalPost.bookmarksCount = bookmarks.count;
    }

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
      post: finalPost,
      author: finalPost.author.id
    });
    finalPost.queuedIDs = queuedIDs;
    finalPost.relatedPosts = relatedPosts;
    const { relatedPosts: __d, author: __, ...rest } = post;

    return {
      post: finalPost
    };
  }
);
/**
 * Queries a post by its slug and fetches detailed information along with related posts and navigation data.
 *
 * @constant
 * @name queryPostBySlug
 * @type {Function}
 * @param {Object} params - The parameters for the query.
 * @param {string} params.slug - The slug of the post to be queried.
 * @returns {Promise<{
 *   post: SingleArticle,
 *   prev: (null | PostOverview),
 *   next: (null | PostOverview)
 * } | null>} A promise that resolves to an object containing the retrieved post,
 *           the previous post, and the next post, or null if no post is found.
 *
 * @description
 * This function fetches a single blog post by its unique slug, processes it to include detailed information
 * such as author, image, bookmarks, and related posts, while considering configurations for draft mode and payload access.
 * It also determines the "prev" and "next" posts for easier navigation between posts.
 */
type RichRoot = {
  root: {
    type?: string;
    children: unknown[];
    direction?: string | null;
    format?: string;
    indent?: number;
    version?: number;
  };
};

const EMPTY_RICH_TEXT: RichRoot = {
  root: {
    type: "root",
    children: [],
    direction: "ltr",
    format: "left",
    indent: 0,
    version: 0
  }
};

type LexicalNode = {
  type?: string;
  text?: string;
  children?: LexicalNode[];
  [k: string]: unknown;
};

/** Recursively count plain-text characters under a node. */
const countText = (node: LexicalNode): number => {
  if (typeof node.text === "string") return node.text.length;
  const kids = node.children;
  if (!Array.isArray(kids)) return 0;
  let total = 0;
  for (const k of kids) total += countText(k);
  return total;
};

/** Take the first N text characters from a list-or-block node, clipping its
 *  descendants in place so partial nodes survive. Returns the (possibly cloned)
 *  node and the number of chars actually consumed. */
const sliceNode = (
  node: LexicalNode,
  budget: number
): { node: LexicalNode; consumed: number } => {
  if (budget <= 0) return { node: { ...node, children: [] }, consumed: 0 };
  if (typeof node.text === "string") {
    if (node.text.length <= budget) {
      return { node: { ...node }, consumed: node.text.length };
    }
    // Try to cut on a word boundary if there's one within the budget.
    let cut = budget;
    const space = node.text.lastIndexOf(" ", budget);
    if (space > budget * 0.5) cut = space;
    return {
      node: { ...node, text: node.text.slice(0, cut).trimEnd() + "…" },
      consumed: cut
    };
  }
  const kids = node.children;
  if (!Array.isArray(kids)) return { node: { ...node }, consumed: 0 };
  const out: LexicalNode[] = [];
  let used = 0;
  for (const child of kids) {
    if (used >= budget) break;
    const { node: clipped, consumed } = sliceNode(child, budget - used);
    if (consumed > 0 || (clipped.children && clipped.children.length > 0)) {
      out.push(clipped);
      used += consumed;
    }
  }
  return { node: { ...node, children: out }, consumed: used };
};

const extractTeaser = (content: unknown, fraction = 0.2): RichRoot | null => {
  const rt = content as RichRoot | null | undefined;
  const root = rt?.root;
  const children = root?.children as LexicalNode[] | undefined;
  if (!Array.isArray(children) || children.length === 0) return null;

  const totalChars = children.reduce((acc, n) => acc + countText(n), 0);
  if (totalChars === 0) return null;

  // Clamp the teaser to ~20% of the post body, with hard floor/ceiling so
  // a one-paragraph essay still teases something readable and a 30k-char
  // long-read doesn't reveal 6k chars.
  const targetChars = Math.max(
    240,
    Math.min(900, Math.ceil(totalChars * fraction))
  );

  const out: LexicalNode[] = [];
  let used = 0;
  for (const child of children) {
    if (used >= targetChars) break;
    const childTextLen = countText(child);
    if (childTextLen === 0) {
      // Decorative / image / divider node — keep verbatim, doesn't count.
      out.push(child);
      continue;
    }
    if (used + childTextLen <= targetChars) {
      out.push(child);
      used += childTextLen;
    } else {
      const { node: clipped } = sliceNode(child, targetChars - used);
      out.push(clipped);
      used = targetChars;
    }
  }

  return {
    ...rt,
    root: {
      ...root!,
      children: out as unknown[]
    }
  };
};

export const queryPostBySlug = async ({
  slug: sl
}: {
  slug: string;
}): Promise<{
  post: SingleArticle;
  prev: null | PostOverview;
  next: null | PostOverview;
  gate: GateResult;
  teaser: RichRoot | null;
} | null> => {
  // "use cache";

  const { isEnabled: draft } = await draftMode();
  let slug = sl;
  if (sl.includes("+")) {
    const ss = sl.split("+")[0];
    ss && (slug = ss);
  }
  const payload = await getPayload({ config: configPromise });
  const sessionResp = await authClient.getSession().catch(() => null);
  const sessionUser = sessionResp?.data?.user ?? null;

  // Bypass better-auth's session cookie cache by reading the role straight
  // from the DB. Without this, a freshly-promoted Member sees stale
  // role:"user" in their session for up to 5 minutes (cookieCache.maxAge),
  // and the gate locks them out of content they should now access.
  let freshRole: RP_Roles = "guest" as RP_Roles;
  let freshUserId: string | null = null;
  if (sessionUser?.id) {
    freshUserId = String(sessionUser.id);
    const u = await payload
      .findByID({
        collection: "users",
        id: freshUserId,
        depth: 0,
        overrideAccess: true,
        select: { role: true }
      })
      .catch(() => null);
    if (u && (u as { role?: string }).role) {
      freshRole = (u as { role: string }).role as RP_Roles;
    } else if (sessionUser.role) {
      freshRole = sessionUser.role as RP_Roles;
    }
  }

  const select = singlePostSelect();
  // overrideAccess + disableLockerRedact context: we want the FULL post
  // (including content) so the Paywall surface can extract a teaser snippet.
  // We then run gatePostForUser ourselves and strip / send teaser as needed.
  const post: FetchedPost | null = await payload
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
      overrideAccess: true,
      select,
      user: sessionUser ?? null,
      context: { disableLockerRedact: true }
    })
    .then((r) => r.docs[0] || null)
    .catch((e) => {
      console.error({
        message: `Error while retrieving post by slug ${slug}`,
        error: e
      });
      return null;
    });

  if (!post) {
    return null;
  }

  const finalPost = await constructArticle({ post });
  if (!finalPost) {
    return null;
  }

  const gate = gatePostForUser(
    {
      id: String(finalPost.id),
      authority: finalPost.authority,
      locked: finalPost.locked,
      allowList: finalPost.allowList,
      author: finalPost.author?.id ?? null
    },
    freshUserId ? { id: freshUserId, role: freshRole } : null
  );

  if (!gate.readable) {
    const teaser = extractTeaser(finalPost.content);
    finalPost.content = EMPTY_RICH_TEXT as unknown as typeof finalPost.content;
    finalPost.teaser = (teaser as unknown as typeof finalPost.content) ?? null;
    finalPost.disabled = true;
    finalPost.queuedIDs = [];
    finalPost.relatedPosts = [];
    return { post: finalPost, prev: null, next: null, gate, teaser };
  }

  // 3) Get the related posts (only for readable posts)
  const { queuedIDs, relatedPosts, prev, next } = await queryRelatedPosts({
    post: finalPost,
    limit: 5,
    author: finalPost.author.id
  });
  finalPost.queuedIDs = queuedIDs;
  finalPost.relatedPosts = relatedPosts;
  const { relatedPosts: __d, author: __, ...rest } = post;

  return {
    post: finalPost,
    prev,
    next,
    gate,
    teaser: null
  };
};

export const constructArticle = cache(
  async ({ post }: { post: Pick<Post, SinglePostKeys> }) => {
    const payload = await getPayload({ config: configPromise });
    // 2) Get the author info
    if (!post.author || !post?.slug || !post.publishedAt) {
      return null;
    }
    const image = await getImageMedia({ post, payload });
    const authorID =
      typeof post.author === "string" ? post.author : post.author.id;
    console.log("authorID:" + authorID);
    const author: AuthorOverview | null = await getUserOverview(authorID).catch(
      (e) => {
        console.error({
          message: `Error while retrieving author info`,
          error: e
        });
        return null;
      }
    );
    //This is a rather draconian approach, but I'd like (for now) to not deal with "author may be undefined"
    if (!author) {
      return null;
    }
    const { tagIds } = mapTaggedToIds(post);
    const { tagged } = await getTagOverviews({ tagIds });
    const category = await getCategoryOverview({
      id: typeof post.category === "string" ? post.category : post.category.id
    });
    const finalPost: SingleArticle = {
      ...post,
      author,
      bookmarks: [] as string[],
      publishedAt: post.publishedAt,
      image: image,
      tagged,
      bookmarksCount: 0,
      slug: post.slug,
      category,
      queuedIDs: [],
      allowList:
        post?.allowList?.map((r) => (typeof r === "string" ? r : r.id)) || [],
      authority: post.authority || 0,
      locked: post.locked || false,
      relatedPosts: [],
      disabled: false,
      content: post.content
    };
    const bookmarks = await getPostBookMarks({ id: `${post.id}` });
    if (bookmarks) {
      finalPost.bookmarks = bookmarks.bookmarks;
      finalPost.bookmarksCount = bookmarks.count;
    }
    return finalPost;
  }
);
export const queryPostByID = cache(
  async ({ id }: { id: string }): Promise<{ post: SingleArticle } | null> => {
    const payload = await getPayload({ config: configPromise });
    const poste = await payload.findByID({
      collection: "posts",
      id,
      select: singlePostSelect()
    });
    const post = await constructArticle({ post: poste });
    return post ? { post } : null;
  }
);

export const queryRelatedPosts = cache(
  async ({
    post: { id: postID, publishedAt, updatedAt, relatedPosts },
    limit = 2,
    author,
    isAuthorPage = false,
    user
  }: {
    post: SingleArticle;
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
    relatedPosts: PostOverview[];
    prev: PostOverview | null;
    next: PostOverview | null;
  }> => {
    //Now we first query for the posts to show in the "More Like This" sidebar
    const relatedPost: PostOverview[] = [];
    const isAuthorMode = isAuthorPage && !!author;
    const nextSlugs: string[] = [];
    const relatedIDs: string[] = [];
    const displayPostLimit = 5;
    const select = postOverviewSelect();
    const payload = await getPayload({ config: configPromise });

    //1) We query for the IDs we got from related posts - sliced by (0,3)
    if (
      relatedPosts &&
      Array.isArray(relatedPosts) &&
      relatedPosts.length > 0
    ) {
      const ids = relatedPosts.map((r) => r.id);

      const directlyRelatedPosts = await getPostOverviews({
        where: {
          id: {
            in: ids
          }
        },
        limit: displayPostLimit
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
        const relPosts = await getPostOverviews({
          where: {
            and: smAnd
          },
          limit: displayPostLimit - relatedPost.length
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
      const queuedPosts = await payload.find({
        collection: "posts",

        select: {
          slug: true
        }
      });
      getPostOverviews({
        where: {
          and
        },
        limit: queryLimit
      }).catch((r) => {
        console.error({
          message: `Error while retrieving related posts`,
          error: r
        });
        return null;
      });
      if (queuedPosts && queuedPosts.docs.length > 0) {
        relatedIDs.push(...queuedPosts.docs.map((r) => r.id));
      }
    }

    let prev: PostOverview | null = null;
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
                    greater_than: publishedAt || updatedAt
                  }
                },
                {
                  updatedAt: {
                    greater_than: updatedAt
                  }
                }
              ]
            }
          ]
        },
        limit: 1,
        pagination: false,
        select
      })
      .then((r) => r.docs[0] || null)
      .then((r) =>
        r
          ? {
              ...r,
              tagged: (r.tagged || []) as TagOverview[],
              publishedAt: r.publishedAt as string,
              authority: typeof r.authority === "number" ? r.authority : 0,
              author: typeof r.author === "string" ? r.author : r.author.id,
              allowList:
                r.allowList?.map((r) => (typeof r === "string" ? r : r.id)) ||
                [],
              locked: r.locked || false,
              category: r.category as CategoryOverview
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
          select
        })
        .then((r) => r.docs[0] || null)
        .then((r) =>
          r
            ? {
                ...r,
                tagged: (r.tagged || []) as TagOverview[],
                publishedAt: r.publishedAt as string,
                authority: typeof r.authority === "number" ? r.authority : 0,
                author: typeof r.author === "string" ? r.author : r.author.id,
                allowList:
                  r.allowList?.map((r) => (typeof r === "string" ? r : r.id)) ||
                  [],
                locked: r.locked || false,
                category: r.category as CategoryOverview
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
      const p = await getUserOverview(prevv.author);
      if (p) {
        const image = await getImageMedia({ payload, post: prevv });
        prev = {
          ...prevv,
          author: p,
          image,
          bookmarks: [],
          bookmarksCount: 0
        };
      }
    }
    let next: PostOverview | null = null;

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
                    less_than: publishedAt
                  }
                },
                {
                  updatedAt: {
                    less_than: updatedAt
                  }
                }
              ]
            }
          ]
        },
        limit: 1,
        pagination: false,
        select: postOverviewSelect()
      })
      .then((r) => r.docs[0] || null)
      .then((r) =>
        r
          ? {
              ...r,
              tagged: (r.tagged || []) as TagOverview[],
              publishedAt: r.publishedAt as string,
              authority: typeof r.authority === "number" ? r.authority : 0,
              author: typeof r.author === "string" ? r.author : r.author.id,
              allowList:
                r.allowList?.map((r) => (typeof r === "string" ? r : r.id)) ||
                [],
              locked: r.locked || false,
              category: r.category as CategoryOverview
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
          select: postOverviewSelect()
        })
        .then((r) => r.docs[0] || null)
        .then((r) =>
          r
            ? {
                ...r,
                tagged: (r.tagged || []) as TagOverview[],
                publishedAt: r.publishedAt as string,
                authority: typeof r.authority === "number" ? r.authority : 0,
                author: typeof r.author === "string" ? r.author : r.author.id,
                allowList:
                  r.allowList?.map((r) => (typeof r === "string" ? r : r.id)) ||
                  [],
                locked: r.locked || false,
                category: r.category as CategoryOverview
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
    if (!!nexx) {
      const p = await getUserOverview(nexx.author);
      let image: MediaReq | null = nexx.image
        ? typeof nexx.image.value === "string"
          ? null
          : (nexx.image as MediaReq)
        : null;
      if (!image && typeof nexx.image?.value === "string") {
        const select = imageSelect();
        const img = await payload
          .findByID({
            collection: nexx.image.relationTo,
            id: nexx.image.value as string,
            overrideAccess: true,
            select
          })
          .then((r) => {
            if (r && typeof r.url === "string") {
              return {
                ...r,
                url: r.url as string,
                src: r.url as string
              };
            }
            return null;
          });
        if (img) {
          image = {
            relationTo: nexx.image.relationTo,
            value: img
          };
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
const mapTaggedToIds = <
  T extends Extract<
    DataFromCollectionSlug<CollectionSlug>,
    Pick<Post, "tagged">
  >
>(
  doc: { [x in Exclude<keyof T, "tagged">]?: T[x] | unknown } & Pick<
    T,
    "tagged"
  >
) => {
  const tagIds =
    doc?.tagged?.map((r) => (typeof r === "string" ? r : r.id)) || [];
  return { tagIds };
};
export const getTagOverview = cache(
  async ({
    id,
    select: selectOverride
  }: {
    id: string;

    select?: TagOverviewSelect;
  }) => {
    const payload = await getPayload({ config: configPromise });
    const select = selectOverride || tagOverviewSelect();
    return await payload
      .findByID({
        collection: "tags",
        select,
        id
      })
      .catch((e) => {
        console.error("Error while retrieving tag overview", e);
        throw new Error("Error while retrieving tag overview");
      });
  }
);
export const getCategoryOverview = cache(
  async ({ id }: { id: string }): Promise<CategoryOverview> => {
    const categorySelector = categoryOverviewSelect();
    const payload = await getPayload({ config: configPromise });
    return await payload.findByID({
      collection: "categories",
      id,
      select: categorySelector
    });
  }
);

export const getTagOverviews = cache(
  async ({ tagIds }: { tagIds: string[] }) => {
    const tagOverviewSelectr = tagOverviewSelect();
    const tagged: TagOverview[] = await Promise.allSettled(
      tagIds.map(async (r) =>
        getTagOverview({
          id: r,
          select: tagOverviewSelectr
        })
      )
    ).then((x) => x.flatMap((r) => (r.status === "fulfilled" ? r.value : [])));
    return { tagged };
  }
);
