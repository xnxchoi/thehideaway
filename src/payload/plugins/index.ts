import { blurDataUrlsPlugin } from "@oversightstudio/blur-data-urls";
import { importExportPlugin } from "@payloadcms/plugin-import-export";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import type {
  GenerateImage,
  GenerateTitle,
  GenerateURL
} from "@payloadcms/plugin-seo/types";
import type { CollectionSlug, DataFromCollectionSlug, Plugin } from "payload";
import { getPayload } from "payload";
import { betterAuthPlugin } from "payload-auth/better-auth";

import { revalidateRedirects } from "@/hooks/revalidateRedirects";
import { betterAuthPluginOptions } from "@/lib/auth/options";
import type {
  Album,
  Category,
  Delta,
  Page,
  Playlist,
  Post,
  Profile,
  Track,
  User
} from "@/payload-types";
import { lockerPlugin } from "@/payload/plugins/locker/plugin";
import { getServerSideURL } from "@/utilities/getURL";
import config from "@payload-config";
import { getAssetThumb } from "./getAssetThumb";

import { commentsPlugin } from "@/payload/collections/Comments";
import { imageSearchPlugin } from "@payload-bites/image-search";
import { Assets } from "../collections/Assets";
import { Media } from "../collections/Media";
import { UserMedia } from "../collections/UserMedia";
import { LikesPlugin } from "./Likes";
import { userFieldOrganizerPlugin } from "./userField";

const generateTitle: GenerateTitle<Post | Page | Delta | User> = ({ doc }) => {
  if (doc) {
    if ("name" in doc && doc?.name) {
      return `${doc.name}`;
    }
    if ("title" in doc && doc?.title) {
      return `${doc.title} | The Hideaway`;
    }
  }
  return "The Hideaway";
};
const generateMetaImage: GenerateImage<
  Post | Page | Delta | User | Profile | Album | Playlist | Category
> = async ({ doc, collectionConfig }) => {
  const url = getServerSideURL();
  const payload = await getPayload({ config });
  const slug = collectionConfig?.slug;

  if (doc && slug) {
    switch (slug) {
      case "profile":
        const user = await payload.findByID({
          collection: "users",
          id: (doc as Profile).author as string,
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
      case "users":
        if ("portrait" in doc && doc.portrait) {
          return `${url}/api/userMedia/${doc.portrait}`;
        } else if ("image" in doc && doc.image) {
          return typeof doc.image === "string"
            ? `${url}/api/userMedia/${doc.image}`
            : "";
        }
        return await getAssetThumb();
      case "delta":
      case "posts":
        if ("image" in doc && doc.image) {
          if (typeof doc.image === "string") {
            return `${url}/api/media/${doc.image}`;
          } else if (
            typeof doc.image === "object" &&
            "url" in doc.image &&
            doc.image.url
          ) {
            return doc.image.url;
          }
        }
        break;
    }
  }
  return await getAssetThumb();
};

export type SiteMapCollectionSlug = Extract<
  CollectionSlug,
  | "posts"
  | "pages"
  | "delta"
  | "users"
  | "albums"
  | "playlists"
  | "categories"
  | "tracks"
  | "organizations"
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
  const collectionSlug = collectionConfig.slug as CollectionSlug;
  const urlMap: { [x in SiteMapCollectionSlug]: string } = {
    posts: "/essays/:slug",
    pages: "/",
    delta: "/delta/:slug",
    users: "/users/:slug",
    albums: "/rp.fm/album/:slug",
    playlists: "/rp.fm/mix/:slug",
    categories: "/categories/:slug",
    tracks: "/rp.fm/album/:albumSlug?track=:trackSlug",
    organizations: "/clubs/:slug",
    tags: "/tagged/:slug"
  };
  const docCollection = collectionConfig.slug as SiteMapCollectionSlug;
  switch (docCollection) {
    case "posts":
      return `${url}/essays/${doc.slug}`;
    case "pages":
      return `${url}/${doc.slug}`;
    case "delta":
      return `${url}/delta/${doc.slug}`;
    case "users":
      return `${url}/users/${doc.slug}`;
    case "albums":
      return `${url}/rp.fm/album/${doc.slug}`;
    case "playlists":
      return `${url}/rp.fm/mix/${doc.slug}`;
    case "categories":
      return `${url}/categories/${doc.slug}`;
    case "tracks":
      return `${url}/rp.fm/album/${(doc as Track)?.albumSlug}?track=${doc.slug}`;
    case "organizations":
      return `${url}/clubs/${doc.slug}`;
    case "tags":
      return `${url}/tagged/${doc.slug}`;
    default:
      return `${url}/${docCollection}/${doc.slug}`;
  }
};
export type LockedCollections = Extract<
  CollectionSlug,
  | "posts"
  | "media"
  | "delta"
  | "albums"
  | "playlists"
  | "tracks"
  | "userMedia"
  | "assets"
  | "profile"
>;
export const plugins: Plugin[] = [
  importExportPlugin({}),
  lockerPlugin({
    enabled: true,
    userCollections: ["admins", "users"],
    targetCollections: [
      "posts",
      "media",
      "delta",
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
    generateURL
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
      "delta",
      "albums",
      "playlists",
      "tracks",
      "userMedia",
      "responses",
      "citations"
    ]
  })
];
