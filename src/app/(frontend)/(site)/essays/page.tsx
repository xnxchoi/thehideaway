import type { Metadata } from "next/types";

import { Link } from "@/components/UX/Link/Link";
import { RP_BadgeTag } from "@/components/UX/RP_BadgeTag";
import { RPage } from "@/components/UX/Transition";
import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import { CoverCard } from "@/blocks/heros/ArtHero/components";
import { paginatedPosts } from "@/payload/collections/Posts/api/queryPostOverview";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import PageClient from "./page.client";
import type { CSSProperties } from "react";
import { ArchiveFeatureCard } from "./ArchiveFeature/ArchiveFeatureCard";
import { createRichtext } from "@/payload/collections/Users/helpers/createRichtext";

export default async function Page() {
  const payload = await getPayload({ config: configPromise });
  const sanitizedPageNumber = Number(1);

  const posts = await paginatedPosts({
    limit: 12,
    page: sanitizedPageNumber
  });

  return (
    <RPage type="tags" slug={["posts"]}>
      <PageClient>
        <div className="relative flex w-full flex-col items-center justify-center">
          <CatTitle title="Articles & Essays" />
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
                    <div className={"relative block"}>
                      <ArchiveFeatureCard
                        type={"focus1"}
                        contents={[
                          {
                            collection: "posts",
                            id: "1",
                            subtitle: "Subtitle",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            author: {
                              name: "Author",
                              slug: "author",
                              id: "1"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            collection: "posts",
                            id: "2",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            collection: "posts",
                            id: "3",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "4",
                            collection: "posts",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "5",
                            collection: "posts",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          }
                        ]}
                      />
                    </div>
                    <div className={"relative block"}>
                      <ArchiveFeatureCard
                        type={"focus2"}
                        contents={[
                          {
                            id: "1",
                            collection: "posts",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "2",
                            collection: "posts",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Lorem ipsum dolor sit",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "3",
                            collection: "posts",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Subtitle",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "4",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            collection: "posts",
                            subtitle: "Adipisicing elit. Minima, quod.",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0
                          },
                          {
                            id: "5",
                            title:
                              "Lorem ipsum dolor sit amet consectetur adipisicing elit.",
                            subtitle: "Adipisicing elit. Minima, quod.",
                            author: {
                              id: "1",
                              name: "Author",
                              slug: "author"
                            },
                            category: {
                              id: "1",
                              title: "Category",
                              slug: "category"
                            },
                            publishedAt: "2025-09-30T00:00:00.000Z",
                            slug: "slug",
                            tagged: [],
                            updatedAt: "2025-09-30T00:00:00.000Z",
                            bookmarks: [],
                            bookmarksCount: 0,
                            collection: "posts"
                          }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

export function generateMetadata(): Metadata {
  return {
    title: `Articles & Essays`,
    description: `The latest heard around the estate.`
  };
}
