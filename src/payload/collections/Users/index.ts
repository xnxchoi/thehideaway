import type { User } from "@/payload-types";
import { getUserBookmarks } from "@/payload/collections/Bookmarks/getUserBookmarks";
import { hideIfNotAdmin } from "@/payload/collections/helpers";
import { createProfileHook } from "@/payload/collections/Profile/operations/createProfile";
import { getUserFollowers } from "@/payload/collections/Users/endpoints/getUserFollowers";
import { getUserFollowing } from "@/payload/collections/Users/endpoints/getUserFollows";
import { getUserDetails } from "@/payload/collections/Users/endpoints/getUserDetails";
import { onboardingHandler } from "@/payload/collections/Users/endpoints/onboardingHandler";
import { userOverviewHandler } from "@/payload/collections/Users/endpoints/userOverview";
import {
  revalidateDelete as afterDeleteUser,
  revalidateUser
} from "@/payload/collections/Users/hooks/revalidateUser";
import { beforeChangeUsers } from "@/payload/collections/Users/hooks/beforeChange";
import { userHandleField } from "@/payload/fields/handle";
import { enforceUserFields } from "@types/collections/users";
import { generatePreviewPath } from "@/utilities/generatePreviewPath";
import { getServerSideURL } from "@/utilities/getURL";
import { generateName } from "@/utilities/names";
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField
} from "@payloadcms/plugin-seo/fields";
import { CollectionConfig, Where } from "payload";

export const Users: CollectionConfig = {
  slug: "users",

  defaultPopulate: {
    name: true,
    slug: true,
    label: true,
    portrait: true,
    image: true,

    role: true,
    protected: true,
    verified: true
  },
  forceSelect: enforceUserFields(),
  auth: {
    disableLocalStrategy: true
  },
  admin: {
    defaultColumns: ["username", "name"],
    listSearchableFields: ["name", "email", "username"],
    hidden: hideIfNotAdmin,
    useAsTitle: "username",
    livePreview: {
      url: ({ data, req }) => {
        const path = generatePreviewPath({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "users",
          req
        });

        return `${getServerSideURL()}${path}`;
      }
    },
    preview: (doc, { req }) => {
      const path = generatePreviewPath({
        slug: typeof doc?.slug === "string" ? doc.slug : "",
        collection: "users",
        req
      });

      return `${getServerSideURL()}${path}`;
    }
  },
  fields: [
    {
      name: "portrait",
      type: "text",
      admin: {
        hidden: true
      }
    },
    {
      name: "firstName",
      type: "text",
      required: true,
      index: true,
      defaultValue: () => generateName("first"),
      admin: {
        hidden: true
      }
    },
    {
      name: "lastName",
      type: "text",
      required: true,
      index: true,
      defaultValue: () => generateName("last"),
      admin: {
        hidden: true
      }
    },
    {
      name: "foto",
      type: "ui",
      admin: {
        components: {
          Field: {
            path: "src/payload/fields/ProfileImage/serverProfileField.tsx",
            serverProps: {
              relationTo: "userMedia",
              urlPath: "image",
              idPath: "portrait"
            }
          }
        }
      }
    },
    {
      name: "profile",
      type: "join",
      on: "author",
      collection: "profile",
      admin: {
        allowCreate: false
      },
      defaultLimit: 1
    },
    {
      name: "bio",
      type: "text",
      index: true,
      label: "Bio",
      defaultValue: "A member of The Hideaway.",
      admin: {
        description:
          "A short description of yourself, your passion, work, interest, anything- just keep it interesting."
      }
    },
    {
      name: "location",
      type: "text",
      index: true,
      defaultValue: "Seoul"
    },
    {
      name: "link",
      type: "text",
      index: true,
      defaultValue: "https://thehideaway.com",
      admin: {
        description: "A link to your website or social media profile."
      }
    },
    {
      name: "dynamicLabel",
      type: "ui",
      admin: {
        components: {
          Field: "@/payload/fields/DynamicLabel"
        }
      }
    },
    ...userHandleField(),

    {
      name: "bookmarks",
      type: "join",
      admin: {
        hidden: true
      },
      collection: "bookmarks",
      on: "user"
    },
    {
      type: "group",
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
          relationTo: "userMedia",
          overrides: {
            maxDepth: 2,
            filterOptions: ({ req, siblingData, user }) => {
              if (!user) {
                return false;
              }
              const w: Where = {
                and: [
                  {
                    author: {
                      equals: user?.id
                    }
                  },
                  {
                    mimeType: {
                      contains: "image"
                    }
                  },
                  {
                    filesize: {
                      less_than: 3520000
                    }
                  }
                ]
              };
              return w;
            }
          }
        }),
        MetaDescriptionField({})
      ]
    },
    {
      name: "followers",
      type: "join",
      on: "target",
      admin: {
        hidden: true
      },
      collection: "follows"
    },
    {
      name: "following",
      type: "join",
      admin: {
        hidden: true
      },
      on: "user",
      collection: "follows"
    },
    {
      name: "notifications",
      type: "join",
      defaultSort: "-createdAt",
      where: {
        dismissed: {
          not_equals: true
        }
      },
      defaultLimit: 50,
      maxDepth: 2,
      admin: {
        hidden: true
      },
      on: "recipient",
      collection: "notifications"
    },
    {
      name: "onboarded",
      type: "checkbox",
      defaultValue: false,

      index: true,
      access: {
        update: ({ req }) => {
          if (req.context.overrideAccess === true) return true;
          if (req.user?.role === "admin") return true;
          return false;
        }
      },
      required: true
    },
    {
      name: "onboardingProgress",
      type: "json",
      admin: { hidden: true },
      access: {
        update: ({ req }) => {
          if (req.context.overrideAccess === true) return true;
          if (req.user?.role === "admin") return true;
          return false;
        }
      }
    }
  ],
  hooks: {
    afterRead: [
      async ({ context, req, doc }) => {
        // const profile = await req.payload
        //   .count({
        //     collection: "profile",
        //     overrideAccess: true,
        //     where: {
        //       author: {
        //         equals: user.id,
        //       },
        //     },
        //   })
        //   .then((res) => res.totalDocs || 0)
        //   .catch((e) => {
        //     req.payload.logger.error(
        //       `Error fetching profile for user ${user.id}`,
        //       e,
        //     );
        //     return 0;
        //   });
        // if (profile < 1) {
        //   await createProfile({ req, doc:user }).catch((e) => {
        //     req.payload.logger.error(
        //       `Error creating profile for user ${user.id}`,
        //       e,
        //     );
        //   });
        // }
        return doc;
      }
    ],
    beforeChange: [
      beforeChangeUsers,
      ({ data, req, operation, originalDoc, context }) => {
        const state = data?.banned ? "draft" : "published";
        data._status = state;
        const finalData = {
          ...(operation === "update" ? (originalDoc as User) : {}),
          ...data
        };
        if (operation === "create") {
          context.overrideAccess = true;
          context.createProfile = true;
        }
        if (operation === "update") {
          context.overrideAccess = true;
        }
        return finalData;
      }
    ],
    afterChange: [createProfileHook, revalidateUser],
    afterDelete: [afterDeleteUser]
  },
  endpoints: [
    {
      path: "/:id/following",
      method: "get",
      handler: getUserFollowing
    },
    {
      path: "/:id/followers",
      method: "get",
      handler: getUserFollowers
    },
    {
      path: "/:id/onboarding",
      method: "post",
      handler: onboardingHandler
    },

    {
      path: "/:id/bookmarks",
      method: "post",
      handler: getUserBookmarks
    },
    {
      path: "/:id/overview",
      method: "get",
      handler: userOverviewHandler
    },
    {
      path: "/:id/details",
      method: "get",
      handler: getUserDetails
    }
  ],
  versions: {
    drafts: {
      autosave: false
    },
    maxPerDoc: 20
  }
};
