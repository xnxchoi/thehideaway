import { CatTitle, ArticleArchiveItem } from "@/components/layouts/Tagged/Item";

import { PageRange } from "@/components/UX/PageRange";
import { RPage } from "@/components/UX/Transition";
import { postOverviewSelect } from "@/payload/collections/Posts/api/queryBase";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { surfOverviewSelect } from "@/payload/collections/Surf/api/querySurfOverview";
import { TaggedCollectionSlug } from "@/payload/collections/Tags";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import config from "@payload-config";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getPayload, TypedCollectionSelect } from "payload";

import PageClient from "./page.client";

export const dynamic = "force-dynamic";

type Args = {
  params: Promise<{
    slug: string;
    page: `${number}`;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug, page } = await paramsPromise;
  const tag = await getTag({ slug });
  if (!tag) {
    notFound();
  }

  const posts = await queryPostOverviews({
    limit: 12,
    page: Number(page),

    where: {
      tagged: {
        equals: tag.id
      }
    }
  });
  return (
    <RPage type="tags" slug={[slug]}>
      <PageClient>
        <div className="relative flex w-full flex-col items-center justify-center">
          <CatTitle>{tag.title}</CatTitle>
          <div
            className={
              "relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
            }
          >
            <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
              {posts.docs.map(({ slug, author, category, ...post }) => (
                <ArticleArchiveItem
                  key={post.id}
                  {...post}
                  author={author.name}
                  category={category.title}
                  url={formatCollectionURL({ relationTo: "posts", slug })}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="container">
          <PageRange
            collection="posts"
            page={Number(page)}
            basePath={`tagged/${slug}`}
            limit={12}
            totalDocs={posts.totalDocs}
          />
        </div>
      </PageClient>
    </RPage>
  );
}

async function getTag({ slug }: { slug: string }) {
  // "use cache";
  // cacheLife("days");
  const payload = await getPayload({ config });
  return await payload
    .find({
      collection: "tags",
      where: {
        slug: {
          equals: slug
        }
      },
      pagination: false,
      overrideAccess: true,
      limit: 1,
      select: {
        title: true,
        slug: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
}

async function getTagPosts({ id }: { id: string }) {
  // "use cache";
  const buildSelect = <T extends TaggedCollectionSlug>(
    collectionSlug: T
  ): TypedCollectionSelect[T] => {
    const select: TypedCollectionSelect[T] = {
      title: true,
      slug: true
    };
    switch (collectionSlug) {
      case "posts":
        return postOverviewSelect();
      case "surf":
        return surfOverviewSelect();

      default:
        return select;
    }
  };
  const payload = await getPayload({ config });
  await payload.find({
    collection: "search",
    where: {}
  });
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug, page } = await paramsPromise;
  return {
    title: `Tagged: ${slug || ""} - ${page || ""}`
  };
}
