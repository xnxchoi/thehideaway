export const dynamic = "force-dynamic";

import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import { RPage } from "@/components/UX/Transition";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import type { Metadata } from "next/types";
import PageClient from "./page.client";

export default async function Page() {
  const posts = await getFrontPagePosts();

  return (
    <RPage type="posts" slug={["posts"]}>
      <PageClient>
        <div className="relative flex w-full flex-col items-center justify-center">
          <CatTitle>{"Articles & Essays"}</CatTitle>
          <div
            className={
              "relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
            }
          >
            <div>
              <div className={"p-0"}>
                <div className={"relative h-full w-full"}>
                  <div className={"w-full"}>
                    <div
                      className={
                        "relative z-[150] mx-auto flex w-[calc(100%-5rem)] max-w-[var(--maxContainerWidth)] translate-y-[1rem] rounded-t-[20px] rounded-b-[0]"
                      }
                    ></div>
                  </div>
                </div>
              </div>
            </div>
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
      </PageClient>
    </RPage>
  );
}
async function getFrontPagePosts() {
  // "use cache";
  // cacheTag("posts-sitemap");
  return await queryPostOverviews({
    limit: 12,
    page: 1
  });
}

export function generateMetadata(): Metadata {
  return {
    title: `Articles & Essays`,
    description: `The latest heard around the estate.`
  };
}
