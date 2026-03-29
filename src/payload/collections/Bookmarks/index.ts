import { getBookmarkExistance } from "@/payload/collections/Bookmarks/server/getBookmarkExistance";
import { Bookmark } from "@payload-types";
import { NextResponse } from "next/server";
import { CollectionConfig } from "payload";
import { uuidv7 } from "uuidv7";
import { createValidQueryStringRegex } from "../../../utilities/regexUtilities";
import { filterByCurrentUser } from "../helpers";

export const bookmarkTypes: Bookmark["target"]["relationTo"][] = [
  "posts",
  "surf",
  "profile",

  "users",
  "albums",
  "playlists",
  //
  "tracks",
  "userMedia"
];
export const validTypes = [
  "posts",
  "surf",
  "profile",

  "users",
  "albums",
  "playlists",
  //
  "tracks",
  "userMedia"
] as const;
export const bookmarkTypesRegex = createValidQueryStringRegex(bookmarkTypes);
export const Bookmarks: CollectionConfig = {
  slug: "bookmarks",
  admin: {
    useAsTitle: "id",
    baseFilter: filterByCurrentUser
  },
  access: {
    read: ({ req }) => {
      return true;
    }
  },
  fields: [
    {
      name: "id",
      type: "text",
      defaultValue: uuidv7,
      access: {
        update: () => false
      },
      required: true,
      admin: {
        hidden: true
      }
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
      required: true,
      maxDepth: 0,
      index: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    },
    {
      name: "target",
      type: "relationship",
      relationTo: [...validTypes],
      required: true,
      hasMany: false,
      index: true,
      maxDepth: 1,
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    }
  ],
  endpoints: [
    {
      path: "/exists",
      method: "post",
      handler: async (req) => {
        const payload = req.payload;
        const query = req.query as {
          collection: Bookmark["target"]["relationTo"];
          value: string;
          userId?: string;
        };
        const currentUser = req.user;
        const tgUser = query.userId || currentUser?.id;
        if (!tgUser)
          return NextResponse.json(
            {
              error: "ID of the user is required"
            },
            {
              status: 400
            }
          );
        const postAuthor =
          query.collection === "users"
            ? [query.value]
            : await payload
                .findByID({
                  collection: query.collection,
                  id: query.value,
                  select: {
                    author: true
                  },
                  overrideAccess: true
                })
                .then((r) => (Array.isArray(r.author) ? r.author : [r.author]))
                .then((r) => r.map((x) => (typeof x === "string" ? x : x.id)));
        if (
          !currentUser ||
          !(
            tgUser === currentUser.id ||
            postAuthor.some((r) => r === currentUser.id) ||
            currentUser.role === "admin" ||
            req.context.overrideAccess
          )
        ) {
          return NextResponse.json(
            {
              error: "You are not authorized to perform this action"
            },
            {
              status: 403
            }
          );
        }

        const { collection, value } = query;
        if (!collection || !value) {
          return NextResponse.json(
            {
              error: "Please provide target item ID and collection."
            },
            {
              status: 401
            }
          );
        }
        const res = await getBookmarkExistance({
          target: {
            relationTo: collection,
            value
          },
          userId: tgUser
        }).catch((e) => {
          payload.logger.error(
            `[USER_REQUEST]: Failed to check bookmark existence - User: ${tgUser}, Collection: ${collection}, Value: ${value}, Error: ${e}`
          );
          return null;
        });
        if (res === null) {
          return NextResponse.json(
            {
              error: "Something went wrong"
            },
            {
              status: 500
            }
          );
        } else {
          return NextResponse.json(
            {
              message: res ? "bookmarked" : "not_bookmarked",
              data: {
                target: {
                  relationTo: collection,
                  value
                },
                user: {
                  id: tgUser
                }
              }
            },
            {
              status: 200
            }
          );
        }
      }
    }
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!req.user) {
          return;
        }
        if (operation === "create") {
          const bookmarkExists = await req.payload
            .count({
              collection: "bookmarks",
              where: {
                and: [
                  {
                    "target.relationTo": {
                      equals: data.target.relationTo
                    }
                  },
                  {
                    "target.value": {
                      equals: data.target.value
                    }
                  },
                  {
                    user: {
                      equals: data.user
                    }
                  }
                ]
              }
            })
            .then((count) => {
              return count.totalDocs > 0;
            })
            .catch((err) => {
              console.error(err);
              return false;
            });
          if (!bookmarkExists) {
            return data;
          }
        }
        if (operation === "update") {
          return originalDoc;
        }
      }
    ]
  }
};
