import { Banner } from "@/payload/blocks/Banner/config";
import { Code } from "@/payload/blocks/Code/config";
import { MediaBlock } from "@/payload/blocks/MediaBlock/config";
import {
  generatePreviewPath,
  generatePreviewPathWithAuthor
} from "@/utilities/generatePreviewPath";
import {
  BlocksFeature,
  type DefaultNodeTypes,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
  type LinkFields
} from "@payloadcms/richtext-lexical";
import {
  AccessArgs,
  CollectionConfig,
  headersWithCors,
  PayloadRequest,
  type TextFieldSingleValidation,
  Where
} from "payload";
import { sanitizeAuthor } from "../../fields/AuthorFields/hooks";
import { revalidateDelete, revalidatePost } from "./hooks/revalidatePost";

import { populatePublishedAt } from "@/hooks/populatePublishedAt";
import { Post } from "@/payload-types";
import { AuthorField } from "@/payload/fields/AuthorFields/AuthorField";
import { slugField } from "@/payload/fields/slug";
import { filterDocByCurrentUser } from "@/payload/utilities/filterDocByCurrentUser";
import { CatOverview } from "@/types/collections/delta";
import {
  MetaImageField,
  MetaTitleField,
  OverviewField
} from "@payloadcms/plugin-seo/fields";
import { uuidv7 } from "uuidv7";
import {
  postBookmarkSaveHandler,
  unBookmarkPostHandler
} from "./api/bookmarkPostHandler";
import { getPostHandler } from "./api/getPostHandler";
import { postBookmarksHandler } from "./api/postBookmarksHandler";
const INLINE_RICH_TEXT_FIELDS = [
  "toolbarInline",
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "inlineCode",
  "align"
];

export const Posts: CollectionConfig<"posts"> = {
  slug: "posts", // This config controls what's populated by default when a post is referenced
  // https://payloadcms.com/docs/queries/select#defaultpopulate-collection-config-property
  // Type safe if the collection slug generic is passed to `CollectionConfig` - `CollectionConfig<'posts'>
  access: {
    create: ({ req: { user } }) => {
      if (!user || !user.role) return false;
      if (user.role === "user") return true;
      if (user.role === "admin") return true;
      if (user.role === "editor") return true;
      if (user.role === "author") return true;

      return false;
    },
    update: ({ req: { user } }) => {
      if (user?.role === "admin") return true;
      if (user?.role === "editor") return true;
      return {
        author: {
          equals: user?.id
        }
      };
    },
    delete: ({ req: { user } }) => {
      if (!user || !user.role) return false;
      if (user.role === "admin") return true;
      if (user.role === "editor") return true;
      return {
        author: {
          equals: user.id
        }
      };
    },
    read: async (args: AccessArgs) => {
      const { req } = args;
      const { user } = req;
      if (!user || !user.role) {
        return {
          _status: {
            equals: "published"
          }
        } as Where;
      }
      if (user.role === "admin") return true;
      if (user.role === "editor") {
        return true;
      }
      return {
        or: [
          {
            author: {
              equals: user?.id
            }
          },
          {
            _status: {
              equals: "published"
            }
          }
        ]
      };
    }
  },
  defaultPopulate: {
    title: true,
    subtitle: true,
    author: true,
    locked: true,
    image: true,
    meta: {
      image: true
    },
    slug: true,
    category: true
  },

  admin: {
    defaultColumns: ["title", "slug", "updatedAt"],
    baseFilter: filterDocByCurrentUser,
    livePreview: {
      url: async ({
        data,
        req
      }: {
        data: Partial<Post>;
        req: PayloadRequest;
      }) => {
        if (!data) {
          throw new Error("Data is required to generate preview path");
        }
        const currentUser = req.user;
        if (!currentUser) {
          throw new Error("You must be logged in to generate a preview path");
        }
        const author = (data?.author as string | undefined) || currentUser?.id;
        if (!author) {
          throw new Error("Author is required to generate preview path");
        }
        const path = await generatePreviewPathWithAuthor({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "posts",
          req,
          userID: author
        });

        return path;
      }
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "posts",
        req
      }),
    useAsTitle: "title"
  },
  fields: [
    {
      name: "id",
      type: "text",
      required: true,
      defaultValue: () => uuidv7(),
      admin: {
        hidden: true
      },
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    },
    {
      name: "image",
      label: "Cover Image",
      type: "upload",
      maxDepth: 1,
      relationTo: "userMedia",
      admin: {},
      filterOptions: ({ req }) => {
        return {
          //     and: [
          //       {
          //         mimeType: {
          //           like: "image/"
          //         }
          //       },
          //       {
          author: {
            equals: req.user?.id
          }
          //       }
          //     ]
        } as Where;
      }
    },
    {
      type: "tabs",

      tabs: [
        {
          fields: [
            {
              name: "title",
              type: "text",
              label: "Title",
              required: true
            },

            {
              name: "content",
              type: "richText",
              editor: lexicalEditor({
                admin: {
                  hideGutter: true
                },
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,

                    HeadingFeature({
                      enabledHeadingSizes: ["h1", "h2", "h3", "h4"]
                    }),

                    BlocksFeature({ blocks: [Banner, Code, MediaBlock] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                    LinkFeature({
                      enabledCollections: ["pages", "posts", "delta"],
                      fields: ({ defaultFields }) => {
                        const defaultFieldsWithoutUrl = defaultFields.filter(
                          (field) => {
                            if ("name" in field && field.name === "url")
                              return false;
                            return true;
                          }
                        );

                        return [
                          ...defaultFieldsWithoutUrl,
                          {
                            name: "url",
                            type: "text",
                            admin: {
                              condition: (_data, siblingData) =>
                                siblingData?.linkType !== "internal"
                            },
                            label: ({ t }) => t("fields:enterURL"),
                            required: true,
                            validate: ((value, options) => {
                              if (
                                (options?.siblingData as LinkFields)
                                  ?.linkType === "internal"
                              ) {
                                return true; // no validation needed, as no url should exist for internal links
                              }
                              return value ? true : "URL is required";
                            }) as TextFieldSingleValidation
                          }
                        ];
                      }
                    })
                  ];
                }
              }),
              custom: {
                hashes: []
              },
              hooks: {
                beforeChange: [
                  ({ data, value, path, req, context }) => {
                    const r = value;
                    if (!r) return;

                    const targetTypes: DefaultNodeTypes["type"][] = [
                      "text",
                      "quote",
                      "heading",
                      "paragraph",
                      "link",
                      "autolink"
                    ];
                  }
                ]
              },
              label: false,
              required: true
            }
          ],
          label: "Content",
          access: {
            read: () => true
          }
        },
        {
          fields: [
            {
              name: "relatedPosts",
              type: "relationship",
              admin: {
                position: "sidebar"
              },
              filterOptions: ({ req, id }) => {
                const user = req.user;
                if (!user) {
                  return {
                    author: {
                      exists: false
                    }
                  } as Where;
                }
                return {
                  and: [
                    {
                      id: {
                        not_in: [id]
                      }
                    },
                    {
                      _status: {
                        equals: "published"
                      }
                    },
                    {
                      author: {
                        equals: user.id
                      }
                    }
                  ]
                };
              },
              hasMany: true,
              maxRows: 5,
              relationTo: "posts",

              maxDepth: 0
            },
            {
              name: "category",
              type: "relationship",
              label: "Category",
              required: true,
              defaultValue: async ({ req }) => {
                const categories = await req.payload.find({
                  collection: "categories",
                  where: {
                    slug: {
                      equals: "uncategorized"
                    }
                  },
                  depth: 0
                });
                return categories.docs[0] as CatOverview;
              },
              hasMany: false,
              maxDepth: 1,
              relationTo: "categories",
              admin: {
                allowCreate: false,
                allowEdit: false
              }
            }
          ],
          label: "Meta"
        },
        {
          name: "meta",
          label: "SEO",
          fields: [
            OverviewField({
              titlePath: "meta.title",
              descriptionPath: "meta.description",
              imagePath: "meta.image"
            }),
            MetaTitleField({
              hasGenerateFn: true
            }),
            MetaImageField({
              relationTo: "media"
            })
          ]
        }
      ]
    },
    {
      name: "tagged",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
      admin: {
        allowCreate: true,
        allowEdit: false,
        position: "sidebar"
      },
      access: {
        read: () => true
      },
      maxDepth: 1,

      maxRows: 5,
      index: true
    },

    {
      name: "subtitle",
      type: "text",
      label: "Subtitle",
      admin: {
        position: "sidebar"
      },
      required: true
    },
    {
      name: "publishedAt",
      label: "Publish Date",
      type: "date",
      admin: {
        position: "sidebar"
      }
    },

    ...AuthorField(false),
    ...slugField("title", {
      slugOverrides: {
        admin: {
          position: "sidebar"
        },
        required: true
      }
    })
    // Temporarily commented out join field to isolate Drizzle adapter error
    // {
    //   name: "bookmarks",
    //   collection: "bookmarks",
    //   type: "join",
    //   on: "target",
    //   admin: {
    //     hidden: true
    //   }
    // }
  ],
  hooks: {
    beforeChange: [
      sanitizeAuthor(false),
      ({ data, operation, originalDoc, req }) => {
        const { user } = req;
        const datum = data as Omit<Post, "createdAt" | "updatedAt" | "id"> &
          Partial<Pick<Post, "createdAt" | "updatedAt" | "id">>;
        const author =
          operation === "update" ? originalDoc.author : data.author || user?.id;
        if (!author) return;
        if (!datum.subtitle) {
          const content = datum.content.root.children;
          const walkNodes = (nodes: any[]): string | undefined => {
            for (const node of nodes) {
              // Check if current node is a text node with content
              if (node.type === "text" && node.text?.trim()) {
                return node.text;
              }

              // If node has children, recursively walk through them
              if (node.children && Array.isArray(node.children)) {
                const result = walkNodes(node.children);
                if (result) return result;
              }
            }
            return undefined;
          };
          // Find first non-empty text node
          datum.subtitle = walkNodes(content) || "";
        }
        return data;
      },
      populatePublishedAt
    ],
    afterChange: [revalidatePost],

    afterDelete: [revalidateDelete]
  },
  endpoints: [
    {
      path: "/:slug/article",
      method: "get",
      handler: async (req) => {
        const post = await getPostHandler({ req });
        if (!post) {
          return Response.json({ error: "Post not found" }, { status: 404 });
        }
        return Response.json(post, {
          headers: headersWithCors({
            headers: new Headers(),
            req
          })
        });
      }
    },
    {
      path: "/:id/getBookmarks",
      method: "get",
      handler: postBookmarksHandler
    },
    {
      path: "/:id/bookmark",
      method: "post",
      handler: postBookmarkSaveHandler
    },
    {
      path: "/:id/unBookmark",
      method: "delete",
      handler: unBookmarkPostHandler
    }
  ],
  versions: {
    drafts: {
      autosave: false,
      schedulePublish: true
    },

    maxPerDoc: 50
  }
};
