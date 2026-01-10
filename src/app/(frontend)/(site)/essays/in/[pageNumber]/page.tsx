import type { Metadata } from "next/types";

import { PageRange } from "@/payload/components/PageRange";
import { Pagination } from "@/payload/components/Pagination";

import { RPage } from "@/components/UX/Transition";
import { CatTitle } from "@/components/layouts/Tagged/Item";
import {paginatedPosts} from "@/payload/collections/Posts/api/queryPostOverviews";
import configPromise from "@payload-config";
import { notFound } from "next/navigation";
import { getPayload } from "payload";
import PageClient from "./page.client";
type Args = {
  params: Promise<{
    pageNumber: string;
  }>;
};

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const { totalDocs } = await payload.count({
    collection: "posts",
    overrideAccess: false
  });

  const totalPages = Math.ceil(totalDocs / 12);

  const pages: { pageNumber: string }[] = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push({ pageNumber: String(i) });
  }

  return pages;
}
export default async function Page({ params }: Args) {
  const { pageNumber } = await params;
  const payload = await getPayload({ config: configPromise });
  const sanitizedPageNumber = Number(pageNumber);

  if (!Number.isInteger(sanitizedPageNumber)) notFound();

  const posts = await paginatedPosts({
    limit: 12,
    page: sanitizedPageNumber
  });

  return (
    <RPage key={`posts_${posts.page}`} type="posts" slug={["posts"]}>
      <div className="relative flex w-full flex-col items-center justify-center">
        <CatTitle title="Latest" />
        <div
          className={
            "relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
          }
        >
          <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
            <PageClient posts={posts}></PageClient>
          </div>
        </div>
      </div>
      <div className="relative flex w-full flex-col items-center justify-center">
        <div className="mb-8">
          <PageRange
            collection="posts"
            currentPage={sanitizedPageNumber}
            limit={12}
            totalDocs={posts.totalDocs}
          />
        </div>

        {posts?.page && posts?.totalPages > 1 && (
          <Pagination
            page={sanitizedPageNumber}
            totalPages={posts.totalPages}
          />
        )}
      </div>
    </RPage>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: `Articles & Essays`,
    description: `The latest heard around the estate.`
  };
}
