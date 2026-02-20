import {CollectionSlug, PayloadRequest} from "payload";

const collectionPrefixMap: Partial<Record<CollectionSlug, string>> = {
  pages: ""
};
const authorCollectionSuffixMap: Partial<Record<CollectionSlug, string>> = {
  profile: "/profile",
  posts: "/essays",
  surf: "/surf"
};

type PreviewPathProps = {
  collection: keyof typeof collectionPrefixMap;

  slug: string;
  req: PayloadRequest;
};
type PreviewPathWithAuthorProps = {
  collection: keyof typeof authorCollectionSuffixMap;
  req: PayloadRequest;
  slug: string;
  userID: string;
};
export const generatePreviewPathWithAuthor = async ({
  collection,
  slug,
  userID,
  req
}: PreviewPathWithAuthorProps) => {
  if (!userID) {
    throw new Error("User ID is required");
  }
  const user = await req.payload.findByID({
    collection: "users",
    id: userID,
    select: {
      slug: true
    },
    overrideAccess: true
  });
  if (!user) {
    throw new Error(`User with ID ${userID} not found`);
  }
  const userSlug = user.slug;
  const suffix = authorCollectionSuffixMap[collection] ?? "";
  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `/users/${userSlug}${suffix}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || ""
  });

  const url = `/next/preview?${encodedParams.toString()}`;

  return url;
};
export const generatePreviewPath = ({
  collection,
  slug,
  req
}: PreviewPathProps) => {
  const prefix = collectionPrefixMap[collection];

  const encodedParams = new URLSearchParams({
    slug,
    collection,
    path: `${prefix}/${slug}`,
    previewSecret: process.env.PREVIEW_SECRET || ""
  });

  const url = `/next/preview?${encodedParams.toString()}`;

  return url;
};
