import type {Surf} from "@/payload-types";
import {CategoryOverview, TagOverview} from "@/types/collections/meta-collections";
import {AuthorOverview, AuthorSingle} from "@/types/collections/users";
import type {PostOverview} from "./posts";

export type SurfOverview = Omit<ReqSurf, "author"> & {
  author: AuthorOverview;
  tagged: TagOverview[];

  bookmarks: string[];
  bookmarksCount: number;
};
/**
 *  Represents the actual API response-accurate type of fetching a {@link Surf} as of 2025-06-28.
 *
 * Fields that assuredly resolve have been accounted for via explicit typing.
 *
 * **Warning** this is only meant to be used for {@link querySurfOverview querySurfOverview}
 * @todo merge the query into one by setting defaultPopulate config on the {@link Users} collection config
 */
export type ReqSurf = Pick<
  Surf,
  "source" | "id" | "title" |   "content" | "slug" | "updatedAt"|"commentsEnabled"
> & {
  author: string;
  category: CategoryOverview;
  tagged: TagOverview[] | undefined | null;
  publishedAt: string;

  slug: string;
};

export type FocusedSurf = SurfOverview &
  Pick<Surf, "relatedSurfs" | "updatedAt" | "createdAt">;
export type SingleSurf = Omit<FocusedSurf, "author" | "relatedSurfs"> & {
  author: AuthorSingle;
  disabled?: boolean;
  relatedSurfs: (SurfOverview | PostOverview)[];
  queuedIDs: string[];
};
