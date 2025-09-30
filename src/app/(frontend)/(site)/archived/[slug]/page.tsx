import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next/types";
import { type CollectionSlug, getPayload } from "payload";

import PageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";
import { queryPostsByIDs } from "@/payload/collections/Posts/api/queryPostOverview";
import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import config from "@payload-config";
import type { Delta, Post } from "@/payload-types";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const cats = await payload.find({
    collection: "categories",
    limit: 100,
    select: {
      slug: true
    },
    overrideAccess: true
  });

  const slugs = cats.docs.map((cat) => ({ slug: cat.slug }));
  return [...slugs];
}

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise;
  const payload = await getPayload({ config });

  const cat = await payload
    .find({
      collection: "categories",
      where: {
        slug: {
          equals: slug
        }
      },
      limit: 1,
      select: {
        title: true,
        slug: true,
        categorized: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
  if (!cat) {
    notFound();
  }

  const categorized = cat.categorized?.docs as
    | undefined
    | Array<{
        relationTo: Extract<CollectionSlug, "posts" | "delta">;
        value: Partial<Delta> | Partial<Post>;
      }>;
  if (!categorized) {
    return redirect("/archived");
  }
  const postSel = categorized
    .filter((t) => t.relationTo === "posts")
    .map((t) => t.value.id!);
  const deltaSel = categorized
    .filter((t) => t.relationTo === "delta")
    .map((t) => t.value.id!);
  const posts = await queryPostsByIDs({ ids: postSel });

  return (
    <RPage type="categories" slug={[cat.slug]}>
      <PageClient>
        <div className="relative flex w-full flex-col items-center justify-center">
          <CatTitle title={cat.title} />
          <div
            className={
              "relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
            }
          >
            <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
              {posts.docs.map((post) => (
                <TaggedItem
                  key={post.id}
                  {...post}
                  subtitle={post.subtitle ?? ""}
                />
              ))}
            </div>
          </div>
        </div>
      </PageClient>
    </RPage>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug } = await paramsPromise;
  const payload = await getPayload({ config });
  const cat = await payload
    .find({
      collection: "categories",
      where: {
        slug: {
          equals: slug
        }
      },
      limit: 1,
      select: {
        title: true,
        slug: true,
        id: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
  if (!cat) {
    return {
      title: "Categories"
    };
  }
  return {
    title: `Archived: ${cat.title || ""}`,
    description: `${cat.title || ""}`
  };
}
