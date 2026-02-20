import type {Config} from "@/payload-types";
import {createAccessControl} from "better-auth/plugins/access";
import {defaultStatements} from "better-auth/plugins/admin/access";

type MyCollections = Config["collections"];
type MyCollectionSlug = keyof MyCollections;
export type LockedContentOperations = "lock" | "readLocked";
export type AccessOperations = "read" | "update" | "delete" | "create";
export type BackendCollection = keyof Pick<
  MyCollections,
  | "payload-folders"
  | "payload-migrations"
  | "payload-jobs"
  | "payload-locked-documents"
  | "payload-preferences"
  | "userViews"
  | "exports"
  | "deferred-emails"
  | "email-quota"
>;
export type AuthCollections = Extract<
  MyCollectionSlug,
  | "accounts"
  | "passkeys"
  | "organizations"
  | "teams"
  | "admin-invitations"
  | "members"
  | "invitations"
  | "twoFactors"
  | "sessions"
  | "verifications"
>;
const authCollection: {
  [x in AuthCollections]: AccessOperations[];
} = {
  accounts: ["update", "read", "delete", "create"],
  passkeys: ["update", "read", "delete", "create"],
  organizations: ["update", "read", "delete", "create"],
  "admin-invitations": ["update", "read", "delete", "create"],
  members: ["update", "read", "delete", "create"],
  invitations: ["update", "read", "delete", "create"],
  twoFactors: ["update", "read", "delete", "create"],
  sessions: ["update", "read", "delete", "create"],
  verifications: ["update", "read", "delete", "create"]
};
export const authCollections = Object.keys(authCollection) as AuthCollections[];
const backendOperations: {
  [x in BackendCollection]: AccessOperations[];
} = {
  "payload-folders": ["read", "update", "delete", "create"],
  "payload-migrations": ["read", "update", "delete", "create"],
  "payload-jobs": ["read", "update", "delete", "create"],
  "payload-locked-documents": ["read", "update", "delete", "create"],
  "payload-preferences": ["read", "update", "delete", "create"],
  userViews: ["read", "update", "delete", "create"],
  exports: ["read", "update", "delete", "create"],
  "email-quota": ["read", "update", "delete", "create"],
  "deferred-emails": ["read", "update", "delete", "create"]
};

export const backendCollections = Object.keys(
  backendOperations
) as BackendCollection[];
export type ProvidedContent = keyof Pick<
  MyCollections,
  "assets" | "redirects" | "pages" | "notifications" | "categories"
>;
const providedContent: {
  [x in ProvidedContent]: (AccessOperations | LockedContentOperations)[];
} = {
  assets: ["read", "update", "delete", "create", "lock", "readLocked"],

  redirects: ["read", "update", "delete", "create"],

  pages: ["read", "update", "delete", "create", "lock", "readLocked"],

  notifications: ["read", "update", "delete", "create"],

  categories: ["read", "update", "delete", "create"]
};
export const providedContentCollections = Object.keys(
  providedContent
) as ProvidedContent[];
export type UploadCollection = keyof Pick<MyCollections, "userMedia" | "media">;
const uploads: {
  [x in UploadCollection]: (AccessOperations | LockedContentOperations)[];
} = {
  userMedia: ["read", "update", "delete", "create", "lock", "readLocked"],

  media: ["read", "update", "delete", "create", "lock", "readLocked"]
};
export const uploadsCollections = Object.keys(uploads) as UploadCollection[];
export type UserType = keyof Pick<MyCollections, "admins" | "users">;
const userTypes: {
  [x in UserType]: AccessOperations[];
} = {
  admins: ["read", "update", "delete", "create"],
  users: ["read", "update", "delete", "create"]
};
export const userTypesCollections = Object.keys(userTypes) as UserType[];
export type UserContentCollection = keyof Pick<
  MyCollections,
  | "posts"
  | "surf"
  | "responses"
  | "profile"
  | "playlists"
  | "tracks"
  | "albums"
  | "citations"
  | "bookmarks"
>;
const userCreatedContent: {
  [x in UserContentCollection]: (AccessOperations | LockedContentOperations)[];
} = {
  bookmarks: ["read", "update", "delete", "create"],
  posts: ["read", "update", "delete", "create", "lock", "readLocked"],
  citations: ["read", "update", "delete", "create", "lock", "readLocked"],
  surf: ["read", "update", "delete", "create", "lock", "readLocked"],
  profile: ["read", "update", "delete", "create", "lock", "readLocked"],
  playlists: ["read", "update", "delete", "create", "lock", "readLocked"],
  responses: ["read", "update", "delete", "create", "lock", "readLocked"],
  tracks: ["read", "update", "delete", "create", "lock", "readLocked"],

  albums: ["read", "update", "delete", "create", "lock", "readLocked"]
};

export const userContentCollections = Object.keys(
  userCreatedContent
) as UserContentCollection[];
const collectionPermissions: {
  [x in keyof MyCollections]: (AccessOperations | LockedContentOperations)[];
} & {
  self: AccessOperations[];
} = {
  ...defaultStatements,
  ...providedContent,
  ...uploads,
  ...userTypes,
  ...userCreatedContent,
  ...backendOperations,
  ...authCollection,
  // series: ["read", "update", "create", "delete"],
  userViews: ["read", "update", "delete", "create"],
	compilations: ["read"],
	"payload-kv": [],
  citations: ["read", "update", "delete", "create"],
  bookmarks: ["read", "update", "delete", "create"],
  profile: ["read", "update", "delete", "create", "lock", "readLocked"],
  self: ["read", "update", "delete"],
  tags: ["read", "update", "delete", "create"],
  follows: ["read", "update", "delete", "create"]
} as const;
export const accessControl = createAccessControl(collectionPermissions);
