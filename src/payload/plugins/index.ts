import { revalidateRedirects } from "@/hooks/revalidateRedirects";
import { betterAuthPluginOptions } from "@/lib/auth/options";
import type { Track } from "@/payload-types";

import { commentsPlugin } from "@/payload/collections/Comments";
import { TaggedCollectionSlug } from "@/payload/collections/Tags";
import { getAssetThumb } from "@/payload/plugins/getAssetThumb";
import { roleToAuthority } from "@/payload/plugins/locker/fields/authority/utils";
import { lockerPlugin } from "@/payload/plugins/locker/plugin";
import { searchPlugin } from "@/payload/plugins/plugin-search";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { beforeSyncWithSearch } from "@/payload/search/beforeSync";
import { searchFields } from "@/payload/search/fieldOverrides";
import { getServerSideURL } from "@/utilities/getURL";
import { KeysOfValue } from "@/utilities/typeUtilities";
import { blurDataUrlsPlugin } from "@oversightstudio/blur-data-urls";
import { betterAuthPlugin } from "@payload-auth/better-auth";
import config from "@payload-config";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import type {
  GenerateDescription,
  GenerateImage,
  GenerateTitle,
  GenerateURL
} from "@payloadcms/plugin-seo/types";
import {
  CollectionSlug,
  DataFromCollectionSlug,
  getPayload,
  Plugin,
  Where
} from "payload";
import { Assets } from "../collections/Assets";
import { Media } from "../collections/Media";
import { UserMedia } from "../collections/UserMedia";
import { imageSearchPlugin } from "./image-search";
import { LikesPlugin } from "./Likes";
import { userFieldOrganizerPlugin } from "./userField";
//"tracks"|"albums"|"playlists"|
export type EOCollectionSlug = Extract<
  CollectionSlug,
  TaggedCollectionSlug | "categories" | "tags"
>;
export type EOCollection<T extends EOCollectionSlug = EOCollectionSlug> =
  DataFromCollectionSlug<T>;
const generateTitle: GenerateTitle<EOCollection> = ({
  doc,
  collectionSlug: c
}) => {
  const getDeco = <T extends EOCollectionSlug>({
    doc,
    collectionSlug
  }: {
    collectionSlug: T;
    doc: EOCollection<T>;
  }) => {
    switch (collectionSlug) {
      case "surf":
        return { suffix: "| The Hideaway", prefix: "a Surf :" };
      case "posts":
        return { suffix: "| The Hideaway", prefix: "" };
      case "categories":
        return { prefix: "Archive: ", suffix: "" };
      case "tags":
        return {
          prefix: "Tagged: ",
          suffix: ""
        };
      case "profile":
        return {
          prefix: "Profile: ",
          suffix: ""
        };
      default:
        return {
          prefix: "",
          suffix: "| The Hideaway"
        };
    }
  };
  const collectionSlug = c as EOCollectionSlug | undefined;
  if (!!doc && !!collectionSlug) {
    const { prefix, suffix } = getDeco({ doc, collectionSlug });
    return `${prefix}${(doc as DataFromCollectionSlug<typeof collectionSlug>).title}${suffix}`;
  }
  return "The Hideaway";
};
const generateMetaImage: GenerateImage<EOCollection> = async ({
  doc: d,
  collectionSlug
}): Promise<string> => {
  const url = getServerSideURL();
  const payload = await getPayload({ config });

  if (!!d && !!collectionSlug) {
    const slug = collectionSlug as EOCollectionSlug;
    switch (slug) {
      case "profile":
        {
          const doc = d as EOCollection<typeof slug>;
          const user = await payload.findByID({
            collection: "users",
            id: typeof doc.author === "string" ? doc.author : doc.author.id,
            select: {
              image: true,
              portrait: true
            }
          });
          if (user) {
            if (user.portrait) {
              return `${url}/api/userMedia/${user.portrait}`;
            } else if (user.image) {
              return user.image as string;
            }
          }
        }
        return await getAssetThumb();
      case "surf":
      case "posts":
        {
          const doc = d as EOCollection<typeof slug>;

          if ("image" in doc && doc.image) {
            if (typeof doc.image === "string") {
              return `${url}/api/media/${doc.image}`;
            } else if (
              typeof doc.image === "object" &&
              "url" in doc.image &&
              typeof doc.image.url === "string"
            ) {
              return doc.image.url;
            }
          }
        }
        break;
      default:
        return await getAssetThumb();
    }
  }
  return await getAssetThumb();
};
const generateDescription: GenerateDescription<
  EOCollection
> = async (): Promise<string> => {
  return "Content from the Hideaway, a magazine-collective of consumers seeking metaphysical solace.";
};
export type SiteMapCollectionSlug = Extract<
  CollectionSlug,
  | "posts"
  | "pages"
  | "surf"
  | "profile"
  | "albums"
  | "playlists"
  | "categories"
  | "tracks"
  | "tags"
>;
export type SiteMapCollection = DataFromCollectionSlug<SiteMapCollectionSlug>;

const generateURL: GenerateURL<SiteMapCollection> = ({
  doc,
  collectionConfig
}) => {
  const url = getServerSideURL();
  if (!collectionConfig?.slug) {
    throw new Error("Invalid collection config");
  }

  const docCollection = collectionConfig.slug as SiteMapCollectionSlug;
  switch (docCollection) {
    case "posts":
      return `${url}/essays/${doc.slug}`;
    case "pages":
      return `${url}/${doc.slug}`;
    case "surf":
      return `${url}/surf/${doc.slug}`;
    case "profile":
      return `${url}/users/${doc.slug}`;
    case "albums":
      return `${url}/rp.fm/albums/${doc.slug}`;
    case "playlists":
      return `${url}/rp.fm/playlists/${doc.slug}`;
    case "categories":
      return `${url}/archived/${doc.slug}`;
    case "tracks":
      return `${url}/rp.fm/albums/${(doc as Track)?.albumSlug}?track=${doc.slug}`;

    case "tags":
      return `${url}/tagged/${doc.slug}`;
    default:
      return `${url}/${docCollection}/${doc.slug}`;
  }
};
export type LockedCollections = Exclude<
  KeysOfValue<CollectionMap, { locked?: boolean | null }>,
  "search"
>;
export const plugins: Plugin[] = [
  importExportPlugin({
    collections: [
      {
        slug: "posts",
        export: true,
        import: true
      }
    ]
  }),
  lockerPlugin({
    enabled: true,
    userCollections: ["admins", "users"],
    targetCollections: [
      "posts",
      "media",
      "surf",
      "albums",
      "playlists",
      "tracks",
      "userMedia",
      "assets",
      "profile"
    ]
  }),
  redirectsPlugin({
    collections: ["pages", "posts"],
    overrides: {
      access: {
        create: ({ req: { user } }) => {
          if (user?.role === "admin") return true;
          return false;
        },
        read: () => true,
        update: ({ req: { user } }) => {
          if (user?.role === "admin") return true;
          return false;
        }
      },
      admin: {
        hidden: ({ user }) => {
          if (user?.role === "admin") return true;
          return true;
        }
      },
      // @ts-expect-error
      fields: ({ defaultFields }) => {
        return defaultFields.map((field) => {
          if ("name" in field && field.name === "from") {
            return {
              ...field,
              admin: {
                description:
                  "You will need to rebuild the website when changing this field."
              }
            };
          }
          return field;
        });
      },
      hooks: {
        afterChange: [revalidateRedirects]
      }
    }
  }),

  seoPlugin({
    generateTitle,
    generateURL,
    generateImage: generateMetaImage,
    generateDescription
  }),
  searchPlugin({
    collections: [
      "posts",
      "surf",
      "profile",
      "pages",
      "tracks",
      "playlists",
      "albums"
    ],
    beforeSync: beforeSyncWithSearch,
    defaultPriorities: {
      playlists: 10,
      tracks: 10,
      surf: 20,
      albums: 20,
      posts: 10,
      pages: 20,
      profile: 10
    },
    searchOverrides: {
      fields: ({ defaultFields }) => [...defaultFields, ...searchFields],
      admin: {
        baseFilter: ({ req }) => {
          const user = req.user;
          if (!user) {
            return {
              or: [
                {
                  locked: {
                    not_equals: true
                  }
                },
                {
                  authority: {
                    less_than_equal: 1
                  }
                }
              ]
            } as Where;
          }
          const userAuthority = roleToAuthority(user.role);
          const userId = user.id;

          return {
            or: [
              {
                authority: {
                  less_than_equal: userAuthority
                }
              },
              {
                locked: {
                  not_equals: true
                }
              },
              {
                "author.key": {
                  equals: userId
                }
              }
            ]
          } satisfies Where;
        }
      }
    }
  }),
  betterAuthPlugin(betterAuthPluginOptions),
  imageSearchPlugin({
    // providerAccess: ({ req }) => {
    //   if (
    //     req.user &&
    //     ["admin", "author", "editor", "patron"].some(
    //       (r) => r === req.user?.role,
    //     )
    //   )
    //     return true;
    //   return false;
    // },
  }),
  blurDataUrlsPlugin({
    enabled: true,
    collections: [Media, UserMedia, Assets],
    // Blur data URLs Settings (Optional)
    blurOptions: {
      blur: 18,
      width: 32,
      height: "auto"
    }
  }),
  userFieldOrganizerPlugin({
    enabled: true
  }),
  commentsPlugin({
    enabled: true
  }),
  LikesPlugin({
    enabled: true,
    collections: [
      "posts",
      "surf",
      "albums",
      "playlists",
      "tracks",
      "userMedia",
      "responses",
      "citations"
    ]
  })
];
