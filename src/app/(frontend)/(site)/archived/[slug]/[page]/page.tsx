import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getPayload } from "payload";

import { PageRange } from "@/payload/components/PageRange";

import PageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";
import { queryPostOverview } from "@/payload/collections/Posts/api/queryPostOverview";
import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import config from "@payload-config";

export const dynamic = "force-static";
export const revalidate = 600;

type Args = {
  params: Promise<{
    slug: string;
    page: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug, page } = await paramsPromise;
  const payload = await getPayload({ config });
  const cat = await payload
    .find({
      collection: "categories",
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
  if (!cat) {
    notFound();
  }

  const posts = await queryPostOverview({
    limit: 12,
    page: Number(page),

    where: {
      categorized: {
        equals: cat.id
      }
    }
  });
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
              {posts.map((post) => (
                <TaggedItem key={post.id} {...post} />
              ))}
            </div>
          </div>
        </div>
        <div className="container">
          <PageRange
            collection="posts"
            currentPage={Number(page)}
            limit={12}
            totalDocs={posts.length}
          />
        </div>
      </PageClient>
    </RPage>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug, page } = await paramsPromise;
  return {
    title: `Archived: ${slug || ""} - ${page || ""}`
  };
}

export async function generateStaticParams(params: {
  page: number;
  slug: string;
}) {
  const { slug, page } = params;
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
        slug: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
  if (!cat) {
    return [];
  }
  const categorized = await payload
    .find({
      collection: "categories",
      where: {
        slug: {
          equals: slug
        }
      },
      select: {
        categorized: true
      }
    })
    .then((result) => result.docs?.[0]?.categorized ?? null)
    .catch((e) => (console.error(e), null));
  if (!categorized || !categorized.totalDocs || !categorized.docs) {
    return [];
  }
  const totalDocs = categorized.totalDocs;
  const totalPages = Math.ceil(totalDocs / 12);
  const pages: { page: string }[] = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push({ page: String(i) });
  }

  return pages;
}
