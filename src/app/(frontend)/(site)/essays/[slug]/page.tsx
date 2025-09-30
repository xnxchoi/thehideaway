import type { Metadata } from "next";

import { Narrateur } from "@/components/UX/Highlightr";
import { PrevNext } from "@/components/UX/Highlightr/prevNext";
import { RPage } from "@/components/UX/Transition";
import { queryPostBySlug } from "@/payload/collections/Posts/api/queryPostBySlug";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { generateMeta } from "@/utilities/generateMeta";
import { getServerSideURL } from "@/utilities/getURL";
import configPromise from "@payload-config";
import { getPayload } from "payload";
import PageClient from "./page.client";
// export const dynamic = "force-static";
export const revalidate = 600;

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const posts = await payload.find({
    collection: "posts",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    select: {
      slug: true
    },
    user: null
  });

  const postSlug = posts.docs.map(({ slug, id }) => {
    return { slug: slug };
  });
  return [...postSlug];
}

type Args = {
  params: Promise<{
    slug?: string;
  }>;
};

export default async function Post({ params: paramsPromise }: Args) {
  const { slug = "" } = await paramsPromise;
  if (slug.length < 1) return <PayloadRedirects url={"/home"} />;
  const p = await queryPostBySlug({ slug });
  if (!p) return <PayloadRedirects url={"/home"} />;
  const { post, prev, next } = p;

  return (
    <RPage type={"posts"} slug={[slug]} key={slug}>
      <PageClient post={post}>
        <Narrateur post={post} />
      </PageClient>{" "}
      <div
        className={
          "fixed inset-0 z-[0] h-svh w-svw bg-faded-black dark:bg-faded-white"
        }
      ></div>
      {<PrevNext prev={prev} next={next} />}
    </RPage>
  );
}

// queuedIDs={post.post.queuedIDs}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug = "" } = await paramsPromise;
  const p = await queryPostBySlug({ slug });
  if (!p)
    return {
      title: "The Hideaway",
      description: "The Hideaway"
    };
  const url = getServerSideURL();
  const { post } = p;
  const author = post.author;
  return generateMeta({
    doc: {
      title: `${post.title} | @${author.displayUsername || author.name}`,
      image: post.image?.thumbnailURL || post.image?.url || `${url}/assets/`
    }
  });
}
