import { createValidQueryStringRegex } from "@/utilities/regexUtilities";
import { Bookmark } from "@payload-types";

export const bookmarkTypes: Bookmark["target"]["relationTo"][] = [
  "posts",
  "surf",
  "profile",

  "users",
  "albums",
  "playlists",
  //
  "tracks",
  "userMedia"
];
export const validTypes = [
  "posts",
  "surf",
  "profile",

  "users",
  "albums",
  "playlists",
  //
  "tracks",
  "userMedia"
] as const;
export const bookmarkTypesRegex = createValidQueryStringRegex(bookmarkTypes);
