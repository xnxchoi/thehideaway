import {Assets} from "@/payload/collections/Assets";
import {Bookmarks} from "@/payload/collections/Bookmarks";
import {Categories} from "@/payload/collections/Categories";
import {Citations} from "@/payload/collections/Citations";
import {Comments} from "@/payload/collections/Comments";
import {Deltas} from "@/payload/collections/Delta";
import {Follows} from "@/payload/collections/Follows";
import {Media} from "@/payload/collections/Media";
import {Notifications} from "@/payload/collections/Notifications/Notification";
import {Pages} from "@/payload/collections/Pages";
import {Posts} from "@/payload/collections/Posts";
import {Profile} from "@/payload/collections/Profile";
import {Albums} from "@/payload/collections/Radio/Albums";
import {Playlists} from "@/payload/collections/Radio/Playlists";
import {Tracks} from "@/payload/collections/Radio/Tracks";
import {Tags} from "@/payload/collections/Tags";
import {UserMedia} from "@/payload/collections/UserMedia";
import {Users} from "@/payload/collections/Users";
import {UserViews} from "@/payload/collections/UserViews";
import {CollectionConfig} from "payload";
import {Compilations} from "./Compilations"
import {ExternalMedia} from "@/payload/collections/ExternalMedia";

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
  Deltas,
  Profile,
  Albums,
  Tracks,
  Playlists,
  Follows,
  Bookmarks,
  UserViews,
  Citations,
	Comments, Compilations, ExternalMedia
];
