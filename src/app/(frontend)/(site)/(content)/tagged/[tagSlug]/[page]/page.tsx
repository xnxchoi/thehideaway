import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";

import { PageRange } from "@/components/UX/PageRange";
import { RPage } from "@/components/UX/Transition";
import { deltaOverviewSelect } from "@/payload/collections/Delta/api/queryDeltaOverview";
import { postOverviewSelect } from "@/payload/collections/Posts/api/queryBase";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { surfOverviewSelect } from "@/payload/collections/Surf/api/querySurfOverview";
import { TaggedCollectionSlug } from "@/payload/collections/Tags";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import config from "@payload-config";
import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getPayload, TypedCollectionSelect } from "payload";

import PageClient from "./page.client";

export async function generateStaticParams(params: { tagSlug: string }) {
  const { tagSlug } = params;
  const payload = await getPayload({ config });

  const tagAffiliates = await payload
    .find({
      collection: "tags",
      where: {
        slug: {
          equals: tagSlug
        }
      },
      select: { taggedItems: true, slug: true },
      limit: 1,
      overrideAccess: true,
      pagination: false
    })
    .then((result) => result.docs[0] || null)
    .catch((e) => (console.error(e), null));
  if (
    !tagAffiliates ||
    !tagAffiliates.taggedItems ||
    !tagAffiliates.taggedItems.docs
  ) {
    return [];
  }
  const totalDocs =
    tagAffiliates.taggedItems.totalDocs ||
    tagAffiliates.taggedItems.docs.length;
  const totalPages = Math.ceil(totalDocs / 12);
  const pages: { page: `${number}` }[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({
      page: `${i}`
    });
  }

  return pages;
}

type Args = {
  params: Promise<{
    tagSlug: string;
    page: `${number}`;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { tagSlug, page } = await paramsPromise;
  const tag = await getTag({ slug: tagSlug });
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
    <RPage type="tags" slug={[tagSlug]}>
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
                <TaggedItem
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
            basePath={`tagged/${tagSlug}`}
            limit={12}
            totalDocs={posts.totalDocs}
          />
        </div>
      </PageClient>
    </RPage>
  );
}

async function getTag({ slug }: { slug: string }) {
  "use cache";
  cacheLife("days");
  const payload = await getPayload({ config });
  return await payload
    .find({
      collection: "tags",
      where: {
        slug: {
          equals: slug
        }
      },
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
  "use cache";
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
  const { tagSlug, page } = await paramsPromise;
  return {
    title: `Tagged: ${tagSlug || ""} - ${page || ""}`
  };
}
