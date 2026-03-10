import { ImageCollectionOverview } from "@/components/core/Media/types";
import { PostOverviewSelect } from "@/payload/collections/Posts/api/queryBase";
import {
  ProfileOverview,
  ProfileOverviewSelect
} from "@/payload/collections/Profile";
import { SurfOverviewSelect } from "@/payload/collections/Surf/api/querySurfOverview";
import { ImageCollectionOverviewSelect } from "@/types/collections/image-collections";
import {
  CategoryOverview,
  CategoryOverviewSelect,
  TagOverview,
  TagOverviewSelect
} from "@/types/collections/meta-collections";
import { PostOverview } from "@/types/collections/posts";
import { SurfOverview } from "@/types/collections/surf";
import { UserOverview, UserOverviewSelect } from "@/types/collections/users";

export type OverviewMap = {
  posts: PostOverview;
  surf: SurfOverview;
  users: UserOverview;
  categories: CategoryOverview;
  tags: TagOverview;
  userMedia: ImageCollectionOverview<"userMedia">;
  media: ImageCollectionOverview<"media">;
  assets: ImageCollectionOverview<"assets">;
  profile: ProfileOverview;
};
export type OverviewSelectMap = {
  posts: PostOverviewSelect;
  surf: SurfOverviewSelect;
  users: UserOverviewSelect;
  categories: CategoryOverviewSelect;
  tags: TagOverviewSelect;
  userMedia: ImageCollectionOverviewSelect;
  media: ImageCollectionOverviewSelect;
  assets: ImageCollectionOverviewSelect;
  profile: ProfileOverviewSelect;
};
export type SelectOverview<T extends keyof OverviewSelectMap> =
  OverviewSelectMap[T];
export type OverviewOf<T extends keyof OverviewSelectMap> = SelectOverview<T>;
