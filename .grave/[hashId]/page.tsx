import { currentUser } from "../../src/lib/auth/context/get-context-props";
import {
  getCompilationByHashId,
  getUserBookmarkedItems
} from "../../src/payload/collections/Compilations/actions";
import { notFound, redirect } from "next/navigation";
import { getPayload } from "payload";
import CompilationDetailClient from "./page.client";
import type { User } from "../../src/payload-types";
import configPromise from "../../src/payload.config";
export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const nm = await payload.find({
    collection: "compilations",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    select: {
      hashId: true
    },

  });

  const postSlug = posts.docs.map(({ slug, id }) => {
    return { slug: slug };
  });
  return [...postSlug];
}

}
export const generateMetadata = async ({
  params
}: {
  params: Promise<{ hashId: string }>;
}) => {
  const { hashId } = await params;
  const compilation = await getCompilationByHashId(hashId);
  return { title: compilation?.title ?? "List" };
};

export default async function CompilationDetailPage({
  params
}: {
  params: Promise<{ hashId: string }>;
}) {
  const { hashId } = await params;
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  const compilation = await getCompilationByHashId(hashId);
  if (!compilation) return notFound();

  // Only owner can edit; others can read public compilations
  const authorId =
    typeof compilation.author === "string"
      ? compilation.author
      : (compilation.author as User).id;
  const isOwner = authorId === user.id;

  if (!isOwner && compilation.visibility !== "public") return notFound();

  const bookmarkedItems = isOwner ? await getUserBookmarkedItems() : {};

  return (
    <CompilationDetailClient
      compilation={compilation as any}
      userId={user.id}
      role={(user as any).role ?? "user"}
      isOwner={isOwner}
      bookmarkedItems={bookmarkedItems}
    />
  );
}
