import { currentUser } from "@/lib/auth/context/get-context-props";
import { getCompilationByHashId } from "@/payload/collections/Compilations/actions";
import { notFound } from "next/navigation";
import type { User, Media } from "@/payload-types";
import PublicCompilationClient from "./page.client";

export const generateMetadata = async ({
  params
}: {
  params: Promise<{ username: string; hashId: string }>;
}) => {
  const { hashId } = await params;
  const compilation = await getCompilationByHashId(hashId);
  if (!compilation) return { title: "Not found" };
  const author = compilation.author as User | string;
  const authorName = typeof author === "string" ? null : author.name;
  return {
    title: `${compilation.title}${authorName ? ` — ${authorName}` : ""}`,
    description: compilation.description ?? undefined
  };
};

export default async function PublicCompilationPage({
  params
}: {
  params: Promise<{ username: string; hashId: string }>;
}) {
  const { hashId } = await params;

  const [compilation, viewer] = await Promise.all([
    getCompilationByHashId(hashId),
    currentUser()
  ]);

  if (!compilation || compilation.visibility !== "public") return notFound();

  const authorObj = compilation.author as User | string;
  const authorId = typeof authorObj === "string" ? authorObj : authorObj.id;
  const isOwner = viewer?.id === authorId;

  return (
    <PublicCompilationClient
      compilation={compilation as any}
      isOwner={isOwner}
      viewerId={viewer?.id ?? null}
    />
  );
}
