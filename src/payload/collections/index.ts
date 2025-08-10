import {Categories} from "@/payload/collections/Categories";
import {Media} from "@/payload/collections/Media";
import {Pages} from "@/payload/collections/Pages";
import {Posts} from "@/payload/collections/Posts";
import {Deltas} from "@/payload/collections/Deltas";
import {CollectionConfig} from "payload";
import {UserMedia} from "@/payload/collections/UserMedia";
import {Notifications} from "@collections/Notifications/Notification";
import {Assets} from "@/payload/collections/Assets";
import {Tracks} from "@/payload/collections/Radio/Tracks";
import {Albums} from "@/payload/collections/Radio/Albums";
import {Playlists} from "@/payload/collections/Radio/Playlists";
import {Profile} from "@/payload/collections/Profile";
import {Bookmarks} from "./Bookmarks";
import {Follows} from "./Follows";
import {Tags} from "./Tags";
import {UserViews} from "./UserViews";
import {Citations} from "./Citations";

export const collections: CollectionConfig[] = [
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
];
