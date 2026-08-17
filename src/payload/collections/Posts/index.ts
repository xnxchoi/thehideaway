import { populatePublishedAt } from "@/hooks/populatePublishedAt";
import { Post } from "@/payload-types";
import { updateCategoryAfterDelete } from "@/payload/collections/Categories/hooks";
import { populateSubtitle } from "@/payload/collections/Posts/hooks/populateSubtitle";
import { authorFields } from "@/payload/fields/AuthorField/AuthorField";
import { sanitizeAuthor } from "@/payload/fields/AuthorField/hooks";
import { idField } from "@/payload/fields/IDField";
import { slugField } from "@/payload/fields/slug";
import { filterDocByCurrentUser } from "@/payload/utilities/filterDocByCurrentUser";
import {
  generatePreviewPath,
  generatePreviewPathWithAuthor,
  resolveRelationshipID
} from "@/utilities/generatePreviewPath";
import { getServerSideURL } from "@/utilities/getURL";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField
} from "@payloadcms/plugin-seo/fields";
import {
  AccessArgs,
  CollectionConfig,
  headersWithCors,
  PayloadRequest,
  Where
} from "payload";
import {
  postBookmarkSaveHandler,
  unBookmarkPostHandler
} from "./api/bookmarkPostHandler";
import { getPostHandler } from "./api/getPostHandler";
import { postBookmarksHandler } from "./api/postBookmarksHandler";
import { revalidateDelete, revalidatePost } from "./hooks/revalidatePost";
import { promoteAuthorAfterPostChange } from "@/payload/collections/Users/hooks/promoteToAuthor";
import { RichContent } from "./richContent";
import { RichTitle } from "./richTitle";
import { PROPS_COLLAPSIBLE } from "@/constants/navigation";

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
        const author = resolveRelationshipID(data?.author) || currentUser.id;
        if (!author) {
          throw new Error("Author is required to generate preview path");
        }
        const path = await generatePreviewPathWithAuthor({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "posts",
          req,
          userID: author
        });

        const livePreviewURL = `${getServerSideURL()}${path}`;
        return livePreviewURL;
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
    idField(),
    {
      name: "image",
      label: "Cover Image",
      type: "upload",
      relationTo: ["userMedia", "assets", "media"],
      admin: {
        components: {
          Field: {
            path: "@/payload/fields/Article/Cover/index.tsx",
            serverProps: {
              relationTo: ["userMedia", "assets", "media"]
            }
          }
        }
      },
      hasMany: false
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
    RichContent() /**
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
   */,
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
        ...authorFields(false),
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
          filterOptions: ({ id, user }) => {
            if (!user) {
              return false;
            }
            const idd: Where = {
              id: {
                not_in: [id]
              }
            };
            const idddd: Where = {
              author: {
                equals: user.id
              }
            };
            return {
              and: [idd, idddd]
            };
          },
          hasMany: true,
          relationTo: "posts",
          maxDepth: 1
        },
        {
          name: "approved_by_editor",
          type: "checkbox",
          defaultValue: false,
          index: true,
          admin: {
            description:
              "Editor approval — required for frontend display (frontpage list, /latest). Authors+ get true on create; member/user posts default false until an editor flips it."
          },
          access: {
            update: ({ req }) => {
              const role = req.user?.role;
              return role === "admin" || role === "editor";
            }
          }
        },
        {
          name: "featured",
          type: "checkbox",
          defaultValue: false,
          index: true,
          admin: {
            description:
              "Editor-only. Promote into the hand-curated 'featured' slots (HomeSquare top, /latest hero). Appears in regular lists with a 'featured' badge if not slotted."
          },
          access: {
            update: ({ req }) => {
              const role = req.user?.role;
              return role === "admin" || role === "editor";
            }
          }
        },
        {
          name: "front_eligible",
          type: "checkbox",
          defaultValue: false,
          index: true,
          admin: {
            description:
              "Computed: did this post pass the publishing scorecard (account age, ban status, prior approvals, etc)? Set by a hook; do not edit manually. (Phase 5 — implementation pending.)"
          },
          access: {
            update: ({ req }) => req.user?.role === "admin"
          }
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
    beforeValidate: [populateSubtitle],
    beforeChange: [
      sanitizeAuthor(false),
      ({ data, operation, originalDoc, req }) => {
        const { user } = req;

        const author =
          operation === "update" ? originalDoc.author : data.author || user?.id;
        if (!author) return;

        return data;
      },
      // Role-based default for `approved_by_editor`:
      // author+ → true on create (their work surfaces immediately).
      // member/user → false on create (waits for editor approval / scorecard).
      ({ data, operation, req }) => {
        if (operation !== "create") return data;
        if (data?.approved_by_editor !== undefined) return data;
        const role = req.user?.role;
        const isAuthorPlus =
          role === "author" || role === "editor" || role === "admin";
        data.approved_by_editor = isAuthorPlus;
        return data;
      },
      populatePublishedAt
    ],
    afterChange: [revalidatePost, promoteAuthorAfterPostChange],

    afterDelete: [revalidateDelete, updateCategoryAfterDelete]
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
  },
  // Compound index on `(author, _status, updatedAt)` — drives the /me/posts
  // index page. The query shape there is consistently:
  //   WHERE author_id = ? [AND _status = ?] ORDER BY updated_at DESC LIMIT n
  // Leading on `author` is mandatory (every /me/* read filters by author);
  // `_status` second so the status-tab pills (Published/Drafts) skip the
  // re-check; `updatedAt` last for the sort. Postgres B-tree handles
  // DESC traversal in reverse, so we don't need to specify direction here
  // — Payload's `indexes` config only takes field names. See
  // https://payloadcms.com/docs/database/indexes#compound-indexes
  indexes: [
    {
      fields: ["author", "_status", "updatedAt"]
    }
  ]
};
