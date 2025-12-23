import {generatePreviewPath, generatePreviewPathWithAuthor} from "@/utilities/generatePreviewPath";
import {AccessArgs, CollectionConfig, headersWithCors, PayloadRequest, Where} from "payload";
import {sanitizeAuthor} from "../../fields/AuthorFields/hooks";
import {revalidateDelete, revalidatePost} from "./hooks/revalidatePost";

import {populatePublishedAt} from "@/hooks/populatePublishedAt";
import {Post} from "@/payload-types";
import {AuthorField} from "@/payload/fields/AuthorFields/AuthorField";
import {slugField} from "@/payload/fields/slug";
import {filterDocByCurrentUser} from "@/payload/utilities/filterDocByCurrentUser";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField
} from "@payloadcms/plugin-seo/fields";
import {uuidv7} from "uuidv7";
import {PROPS_COLLAPSIBLE} from "../constants";
import {postBookmarkSaveHandler, unBookmarkPostHandler} from "./api/bookmarkPostHandler";
import {getPostHandler} from "./api/getPostHandler";
import {postBookmarksHandler} from "./api/postBookmarksHandler";
import {RichContent} from "./richContent";
import {RichTitle} from "./richTitle";

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

    useAsTitle: "title",
    components: {
      views: {
        edit: {
          default: {
            Component: "@/payload/views/Edit/index.tsx#EditView"
          }
        }
      }
    }
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
	    relationTo: ["userMedia", "assets", "exMedia"],
      admin: {
        components: {
          Field: {
            path: "@/payload/fields/Article/Cover/index.tsx",
            serverProps: {
	            relationTo: ["userMedia", "assets", "exMedia"]
            }
          }
        }
      },
	    hasMany: false,
    },
    {
      name: "coverPosition",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 35,
      admin: {
        hidden: true
      }
    },
    {
      name: "title",
      type: "text",
      label: "Title",
      required: true,
      admin: {
        hidden: true
      }
    },
    RichTitle(),
    RichContent(),
	  /**
	   *  {
      name: "richContent",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "@/payload/fields/AccessControlled/RichText/index.tsx#AccessControlledRichTextField"
          }
        }
      }
    }
	   */
    {
      label: PROPS_COLLAPSIBLE,
      type: "collapsible",
      admin: {
        position: "sidebar"
      },
      fields: [
        {
          name: "subtitle",
          type: "text",
          label: "Subtitle",

          required: true
        },
        {
          name: "category",
          type: "relationship",
          admin: {
            position: "sidebar",
            allowCreate: false,
            allowEdit: false
          },
          hasMany: false,
          required: true,
          relationTo: "categories",
          maxDepth: 1,
          defaultValue: async ({ user, req }) => {
            return await req.payload
              .find({
                collection: "categories",
                where: {
                  slug: {
                    equals: "uncategorized"
                  }
                },
                depth: 1,
                limit: 1
              })
              .then((res) => res.docs)
              .then((docs) => docs[0])
              .catch((err) => {
                console.error(err);
                return null;
              });
          }
        },
        ...slugField(),
        {
          name: "publishedAt",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime"
            }
          }
        }
      ]
    },
    {
      label: "Properties",
      type: "collapsible",
      admin: { position: "sidebar" },
      fields: [
        ...AuthorField(false),
        {
          name: "tagged",
          label: "Tags",
          type: "relationship",
          relationTo: "tags",
          hasMany: true,
          admin: {
            allowCreate: true,
            allowEdit: false
          },
          access: {
            read: () => true
          },
          maxDepth: 1,
          maxRows: 5,
          index: true
        },
        {
          name: "relatedPosts",
          type: "relationship",

          label: "Related",
          filterOptions: ({ id }) => {
            return {
              id: {
                not_in: [id]
              }
            };
          },
          hasMany: true,
          defaultValue: async ({ user, req }) => {
            const where = {
              and: [
                {
                  _status: {
                    equals: "published"
                  }
                },
                {
                  author: {
                    equals: user?.id
                  }
                }
              ]
            } as Where;

            const posts = await req.payload
              .find({
                collection: "posts",
                where,
                select: {
                  title: true
                }
              })
              .then((res) => res.docs)
              .then((docs) => docs.map((doc) => doc.id))
              .catch((err) => {
                console.error(err);
                return [];
              });
            return [...posts];
          },
          relationTo: "posts",
          maxDepth: 1
        }
      ]
    },

    {
      label: "SEO",
      type: "collapsible",
      admin: { position: "sidebar" },
      fields: [
        {
          name: "meta",
          type: "group",
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
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: "meta.title",
              descriptionPath: "meta.description"
            })
          ]
        }
      ]
    },

    {
      name: "bookmarks",
      collection: "bookmarks",
      type: "join",
      on: "target",
      admin: {
        hidden: true
      }
    }
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
