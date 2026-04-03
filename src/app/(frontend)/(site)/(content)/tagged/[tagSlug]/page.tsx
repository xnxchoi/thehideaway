import {
  ArchiveFeatureCard,
  OverviewAgnosticItem
} from "@/components/content/archive-view/ArchiveFeature/ArchiveFeatureCard";
import { CatTitle, TaggedItem } from "@/components/layouts/Tagged/Item";
import { Link } from "@/components/core/Link/Link";
import { TagButton } from "@/components/UX/TagButton";
import { RPage } from "@/components/UX/Transition";
import { getImageOverviewByID } from "@/payload/collections/Posts/api/getImageMedia";
import { IndexedCollectionSlug } from "@/payload/plugins/plugin-search/types";
import { RalueAsDataWithRelation } from "@/types/collections/image-collections";
import { searchOverviewSelect } from "@/types/collections/search";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import config from "@payload-config";
import { cacheTag } from "next/cache";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getPayload } from "payload";

import PageClient from "./page.client";

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const tags = await payload.find({
    collection: "tags",
    limit: 100,
    select: {
      slug: true
    },
    overrideAccess: true
  });

  const slugs = tags.docs.map((tag) => ({ tagSlug: tag.slug }));
  return [...slugs];
}

type Args = {
  params: Promise<{
    tagSlug: string;
  }>;
};
export default async function Page({ params: paramsPromise }: Args) {
  const { tagSlug } = await paramsPromise;
  const tag = await getTag({ slug: tagSlug });
  if (!tag) {
    return notFound();
  }
  const posts = await getTagPosts({
    id: tag.id,
    slug: tag.slug
  });
  const topTags = await getTags({ slug: tagSlug });
  const firstFive = posts.slice(0, 5).map(({ value }) => value);
  const rest = posts.slice(5);
  const tagg = {
    title: "Tag",
    slug: "tagSlug"
  };
  return (
    <RPage type="tags" slug={[tag.slug]}>
      <PageClient>
        <div className="flex justify-center">
          <div className="w-full max-w-[calc(100vw-100px)] min-lg:mx-9.5 min-lg:my-0">
            <div className="relative mt-9 block min-lg:mt-[40px] min-lg:mb-15">
              <div className="flex items-start overflow-x-auto overflow-y-hidden">
                <div className="w-9.5 flex-[0_0_auto] min-lg:hidden"></div>

                <Link
                  className="flex items-center rounded-[100px] border-[1px] border-solid border-transparent bg-faded-foreground/10 p-2 leading-[20px] whitespace-nowrap transition-colors ease-out-power2 hover:border-faded-foreground hover:bg-transparent data-[current=true]:border-faded-foreground data-[current=true]:bg-transparent min-lg:mr-9.5 min-lg:pr-6.5"
                  href={`/tagged`}
                  rel={"noopener follow"}
                  data-current={false}
                  data-active={false}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    height="24"
                    width="24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                    ></circle>
                    <path
                      fill="currentColor"
                      fillRule="evenodd"
                      d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.478 2 12s4.477 10 10 10m3.936-14.844.147-.99-.88.477-5.898 3.194-.22.12-.037.246-.984 6.636-.146.99.879-.477 5.899-3.194.22-.119.036-.247zM9.2 15.996l.719-4.846 3.59 2.514zm1.292-5.665 3.59 2.514.718-4.846z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className="ml-3.5 text-sm">Explore topics</span>
                </Link>
                <TagButton tag={tag} key={tag.slug} selected={true} />
                {topTags.map((tagger) => (
                  <TagButton
                    tag={tagger}
                    key={tagger.slug}
                    selected={tagSlug === tagger.slug}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="relative flex w-full flex-col items-center justify-center">
          <CatTitle className={"mt-2 py-4 pb-1 font-serif font-light"}>
            {tag.title}
          </CatTitle>
          <div
            className={
              "relative z-[1] flex w-full flex-col items-center justify-center py-[16px]"
            }
          >
            <div className="w-full max-w-(--maxContainerWidth)">
              <div className={"p-0"}>
                <div className={"relative h-full w-full"}>
                  <div className={"w-full"}>
                    <div
                      className={
                        "relative z-[150] mx-auto flex w-[calc(100%-5rem)] max-w-(--maxContainerWidth) translate-y-[1rem] rounded-t-[20px] rounded-b-[0]"
                      }
                    ></div>
                    <div className={"relative block"}>
                      <ArchiveFeatureCard
                        type={"left"}
                        contents={[...firstFive]}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
              {rest.map(({ value: post, relationTo }) => (
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

async function getTag({ slug }: { slug: string }) {
  "use cache";
  cacheTag("tag-" + slug);
  const payload = await getPayload({ config });

  const tag = await payload
    .find({
      collection: "tags",
      where: {
        slug: {
          equals: slug
        }
      },
      limit: 1,
      pagination: false,
      select: {
        title: true,
        slug: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
  return tag;
}

async function getTags({ slug }: { slug: string }) {
  "use cache";
  cacheTag("tag-" + slug);
  const payload = await getPayload({ config });
  const tags = await payload.find({
    collection: "tags",
    limit: 15,
    select: {
      slug: true,
      title: true
    },
    where: {
      slug: {
        not_equals: slug
      }
    },
    sort: "-tagCount",
    overrideAccess: true
  });
  return tags.docs;
}

async function getTagPosts({
  id,
  slug,
  page = 1,
  limit = 12,
  collections = ["posts", "surf", "pages"]
}: {
  id: string;
  collections?: IndexedCollectionSlug[];
  page?: number;
  limit?: number;
  slug: string;
}): Promise<
  {
    relationTo: IndexedCollectionSlug;
    value: OverviewAgnosticItem;
  }[]
> {
  "use cache";
  cacheTag("tag-" + slug);
  const payload = await getPayload({ config });
  const tagged = await payload
    .find({
      collection: "search",
      where: {
        and: [
          {
            "tags.key": {
              in: [id]
            }
          },
          {
            collection: {
              in: collections as IndexedCollectionSlug[]
            }
          }
        ]
      },
      select: searchOverviewSelect(),
      limit,
      page
    })
    .then((r) =>
      r.docs.map(async (d) => {
        const categoryID = d.category[0]!.key;
        const category = await payload.findByID({
          collection: "categories",
          id: categoryID,
          select: {
            title: true
          }
        });
        let image: RalueAsDataWithRelation | undefined = undefined;
        if (d.meta?.image) {
          const imageRel = d.meta.image.relationTo;
          const imageID =
            typeof d.meta.image.value === "string"
              ? d.meta.image.value
              : d.meta.image.value.id;
          const res = await getImageOverviewByID({
            id: imageID,
            collection: imageRel,
            payload
          });
          image = res || undefined;
        }
        return {
          relationTo: d.doc.relationTo as IndexedCollectionSlug,

          value: {
            id: typeof d.doc.value === "string" ? d.doc.value : d.doc.value.id,
            url: formatCollectionURL({
              slug: d.slug,
              relationTo: d.doc.relationTo as IndexedCollectionSlug
            }),
            title: d.title,
            image,
            author: (d.author[0] && d.author[0].name) || "Unknown",
            subtitle: d.meta?.description || "",
            category: (category && category.title) || "Uncategorized",
            tagged:
              (d.tags &&
                d.tags.map((r) => ({
                  id: r.key,
                  title: r.title,
                  slug: r.slug
                }))) ||
              [],
            authority: d.locked ? d.authority || 2 : 1,
            allowList:
              (d.locked && d.allowList && d.allowList.map((r) => r.key)) || []
          } satisfies OverviewAgnosticItem
        };
      })
    )
    .then(async (r) => await Promise.all(r));
  return tagged;
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { tagSlug: slug } = await paramsPromise;
  const tag = await getTag({ slug });
  if (!tag) {
    return {
      title: "Tagged"
    };
  }
  return {
    title: `Tagged: ${tag.title || ""}`,
    description: `${tag.title || ""}`
  };
}
