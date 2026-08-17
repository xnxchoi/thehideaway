import {
  ArchiveFeatureCard,
  OverviewAgnosticItem
} from "../../../../../../components/content/archive-view/ArchiveFeature/ArchiveFeatureCard";
import { CategoryAccent } from "@/components/identity/accent/CategoryAccent";
import { getCategoryAccent } from "@/components/identity/accent/getCategoryAccent";
import { CatTitle, ArticleArchiveItem } from "@/components/layouts/Tagged/Item";
import { RPage } from "@/components/UX/Transition";
import { queryPostsByIDs } from "@/payload/collections/Posts/api/queryPostOverviews";
import { formatCollectionURL } from "@/utilities/formatCollectionURL";
import config from "@payload-config";
import { notFound } from "next/navigation";
import type { Metadata } from "next/types";
import { getPayload } from "payload";

import PageClient from "./page.client";

type Args = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug } = await paramsPromise;
  const cat = await getCategory({ slug });
  if (!cat) {
    notFound();
  }
  const posts = await getCategoryPosts({ id: cat.id });
  const firstFive = posts
    .slice(0, 5)
    .map(({ slug, author, category, ...posts }): OverviewAgnosticItem => ({
      category: category.title,
      author: author.name,
      url: formatCollectionURL({ relationTo: "posts", slug }),
      ...posts
    }));
  const rest = posts.slice(5);
  const identity = getCategoryAccent(cat);
  return (
    <RPage type="categories" slug={[cat.slug]}>
      <PageClient>
        <CategoryAccent
          identity={identity}
          className="relative flex w-full flex-col items-center justify-center"
        >
          <CatTitle> {cat.title}</CatTitle>
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
                        contents={firstFive}
                        type={identity.layout}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
              {rest.map(({ slug, author, category, ...post }) => (
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
        </CategoryAccent>
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

async function getCategory({ slug }: { slug: string }) {
  "use cache";
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
      joins: false,
      select: {
        title: true,
        slug: true,
        identity: true
      }
    })
    .then((result) => result.docs[0] ?? null)
    .catch((e) => (console.error(e), null));
  return cat;
}

async function getCategoryPosts({ id }: { id: string }) {
  "use cache";
  const payload = await getPayload({ config });
  const postSel = payload
    .find({
      collection: "posts",
      where: {
        and: [
          {
            category: {
              equals: id
            }
          },
          {
            _status: {
              equals: "published"
            }
          }
        ]
      },
      depth: 0,
      limit: 12
    })
    .then((result) => result.docs.map((doc) => doc.id))
    .then((ids) => queryPostsByIDs({ ids }));
  const surfSel = payload
    .find({
      collection: "surf",
      where: {
        and: [
          {
            category: {
              equals: id
            }
          },
          {
            _status: {
              equals: "published"
            }
          }
        ]
      },
      depth: 0,
      limit: 12
    })
    .then((result) => result.docs.map((doc) => doc.id));
  return await postSel.then((results) => results.docs);
}
