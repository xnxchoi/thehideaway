import { Assets } from "@/payload/collections/Assets";
import { Bookmarks } from "@/payload/collections/Bookmarks";
import { Categories } from "@/payload/collections/Categories";
import { Citations } from "@/payload/collections/Citations";
import { Comments } from "@/payload/collections/Comments";
import { Follows } from "@/payload/collections/Follows";
import { Media } from "@/payload/collections/Media";
import { Notifications } from "@/payload/collections/Notifications/Notification";
import { Pages } from "@/payload/collections/Pages";
import { Posts } from "@/payload/collections/Posts";
import { Profile } from "@/payload/collections/Profile";
import { Albums } from "@/payload/collections/Radio/Albums";
import { Playlists } from "@/payload/collections/Radio/Playlists";
import { Tracks } from "@/payload/collections/Radio/Tracks";
import { Surfs } from "@/payload/collections/Surf";
import { Tags } from "@/payload/collections/Tags";
import { UserMedia } from "@/payload/collections/UserMedia";
import { Users } from "@/payload/collections/Users";
import { UserViews } from "@/payload/collections/UserViews";
import { CollectionConfig } from "payload";
import { Compilations } from "./Compilations";
import { EmailQuota } from "@/payload/collections/EmailQuota";
import { DeferredEmails } from "@/payload/collections/DeferredEmails";
import { CommerceOrders } from "@/payload/collections/commerce/Orders";
import { CommerceProducts } from "@/payload/collections/commerce/Products";

export const collections: CollectionConfig[] = [
  Users,
  Assets,
  Categories,
  Media,
  Tags,
  Notifications,
  Pages,
  Posts,
  UserMedia,
  EmailQuota,
  DeferredEmails,
  Profile,
  Albums,
  Tracks,
  Playlists,
  Follows,
  Bookmarks,
  UserViews,
  Surfs,
  Citations,
  Comments,
  Compilations,
  CommerceProducts,
  CommerceOrders
];
