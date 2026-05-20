import { revalidateDeleteProfile } from "@/payload/collections/Profile/hooks/afterDelete";
import {
  createBackgroundColorField,
  createColorField
} from "@/payload/fields/ColorPicker";
import { defaultLexical } from "@/payload/Lexical/defaultLexical";
import { filterDocByCurrentUser } from "@/payload/utilities/filterDocByCurrentUser";
import {
  generatePreviewPath,
  generatePreviewPathWithAuthor
} from "@/utilities/generatePreviewPath";
import type { Profile as ProfileType } from "@payload-types";
import type { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import type { CollectionConfig, Where } from "payload";
import { uuidv7 } from "uuidv7";
import { getProfileBookmarks } from "./endpoints/getProfileBookmarks";
import { revalidateProfile } from "./hooks/revalidateProfile";

export type ProfileSingleSelect = {
  hero: true;
  slides: true;
  title: true;
  slug: true;
};
export type ProfileOverviewSelect = {
  title: true;
  slug: true;
};
export const profileOverviewSelector = (): ProfileOverviewSelect => ({
  title: true,
  slug: true
});
export const profileSelector = (): ProfileSingleSelect => ({
  hero: true,
  slides: true,
  title: true,
  slug: true
});
export type ProfileOverview = Pick<
  ProfileType,
  "id" | "updatedAt" | "locked" | "authority" | "allowList"
> & {
  title: string;
  slug: string;
};
export type SingleProfile = ProfileOverview & {
  slides: Array<{
    id: string;
    title: string;
    visuals: string;
    content: SerializedEditorState;
  }>;
};

export const Profile: CollectionConfig = {
  slug: "profile",

  access: {
    readVersions: ({ req }) => {
      const user = req.user;
      if (req.context.overrideAccess) return true;
      if (!user) return false;
      if (user.role === "editor" || user.role === "admin") return true;
      return {
        author: {
          equals: user.id
        }
      } as Where;
    },
    read: ({ req }) => {
      const user = req.user;
      if (req.context.overrideAccess) return true;
      if (!user)
        return {
          _status: {
            equals: "published"
          }
        };
      if (user.role === "editor" || user.role === "admin") return true;
      return {
        or: [
          {
            author: {
              equals: user.id
            }
          },
          {
            _status: {
              equals: "published"
            }
          }
        ]
      } as Where;
    },
    update: ({ req, data }) => {
      if (req.context.overrideAccess) return true;
      const user = req.user;
      if (user?.role === "admin") return true;
      return {
        or: [
          {
            author: {
              equals: user?.id
            }
          },
          {
            author: {
              exists: false
            }
          }
        ]
      };
    },
    delete: ({ req }) => {
      if (req.context.overrideAccess) return true;
      if (req.user) {
        if (req.user.role === "admin") return true;
      }
      return false;
    }
  },
  admin: {
    baseFilter: filterDocByCurrentUser,

    livePreview: {
      url: async ({ data, req }) => {
        const author = data?.author || req.user?.id;
        if (!author) {
          throw new Error("Author is required to generate preview path");
        }
        const path = await generatePreviewPathWithAuthor({
          slug: typeof data?.slug === "string" ? data.slug : "",
          collection: "profile",
          req,
          userID: author
        });

        return path;
      }
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: typeof data?.slug === "string" ? data.slug : "",
        collection: "profile",
        req
      })
  },
  forceSelect: {
    title: true
  },
  fields: [
    {
      name: "author",
      type: "relationship",
      relationTo: "users",
      index: true,
      required: true,
      maxDepth: 0,
      hasMany: false,
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      defaultValue: ""
    },
    {
      name: "title",
      type: "text",
      index: true,
      required: true,
      defaultValue: ""
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Slides",
          fields: [
            {
              type: "group",
              name: "hero",
              fields: [
                {
                  type: "text",
                  name: "title",
                  required: true,
                  label: "Title",
                  defaultValue: "",
                  index: true
                },
                {
                  type: "text",
                  name: "subtitle",
                  required: true,
                  label: "Subtitle",
                  defaultValue: "",
                  index: true,
                  admin: {}
                },
                createColorField({
                  name: "gradient1",
                  label: "Gradient 1"
                }),
                createBackgroundColorField({
                  name: "gradient2",
                  label: "Gradient 2"
                })
              ]
            },
            {
              type: "array",
              name: "slides",
              maxRows: 4,
              fields: [
                {
                  type: "text",
                  name: "id",
                  defaultValue: () => uuidv7(),
                  access: {
                    update: () => false
                  }
                },
                {
                  type: "text",
                  name: "title",
                  required: true
                },
                {
                  type: "upload",
                  relationTo: "userMedia",
                  hasMany: false,
                  name: "visuals",
                  maxDepth: 0,
                  filterOptions: ({ req, user }) => ({
                    author: {
                      equals: user?.id
                    }
                  })
                },
                {
                  name: "content",
                  type: "richText",
                  editor: defaultLexical
                }
              ]
            }
          ]
        },
        {
          label: "RSVP",
          description:
            "Event RSVP profile fields (Day n Night and future events). A profile with `rsvp.intro` set is treated as opted-in to the public RSVP guest list.",
          fields: [
            {
              type: "group",
              name: "rsvp",
              label: "RSVP profile",
              admin: {
                description: "Public-facing intro shown on /day-n-night/guests."
              },
              fields: [
                {
                  type: "select",
                  name: "tier",
                  label: "Tier",
                  defaultValue: "guest",
                  options: [
                    { label: "Host", value: "host" },
                    { label: "Past attendee", value: "past" },
                    { label: "Guest", value: "guest" }
                  ],
                  admin: {
                    description:
                      "Ordering bucket on the public guest list. Hosts appear first, then past attendees, then everyone else (alpha-sorted within each tier)."
                  }
                },
                {
                  type: "textarea",
                  name: "intro",
                  label: "Intro",
                  maxLength: 200,
                  admin: {
                    description:
                      "Up to 200 characters. Shown when this guest is the active card."
                  }
                },
                {
                  type: "text",
                  name: "igHandle",
                  label: "Instagram handle",
                  admin: {
                    description:
                      "Without the leading @. Only shown in focus state."
                  }
                },
                {
                  type: "array",
                  name: "gallery",
                  label: "Gallery",
                  maxRows: 5,
                  admin: {
                    description:
                      "Up to 5 photos. Shown in focus state — swipeable on mobile, 5-up grid on desktop."
                  },
                  fields: [
                    {
                      type: "text",
                      name: "id",
                      defaultValue: () => uuidv7(),
                      access: {
                        update: () => false
                      }
                    },
                    {
                      type: "upload",
                      relationTo: "userMedia",
                      hasMany: false,
                      name: "media",
                      maxDepth: 0,
                      required: true,
                      filterOptions: ({ user }) => ({
                        author: {
                          equals: user?.id
                        }
                      })
                    }
                  ]
                }
              ]
            }
          ]
        },
        { label: "Preview", fields: [] }
      ]
    },
    {
      name: "bookmarks",
      collection: "bookmarks",
      type: "join",
      on: "target"
    },
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
    }
  ],
  hooks: {
    afterChange: [revalidateProfile],
    afterDelete: [revalidateDeleteProfile]
  },
  endpoints: [
    {
      path: "/:id/bookmarks",
      method: "get",
      handler: getProfileBookmarks
    }
  ],
  versions: {
    drafts: {
      autosave: {
        interval: 800,
        showSaveDraftButton: true
      }
    },
    maxPerDoc: 50
  }
};
