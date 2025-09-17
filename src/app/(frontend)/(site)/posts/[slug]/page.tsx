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
    <RPage type={"posts"} slug={[slug]}>
      <div className="flex h-full w-full flex-col items-center justify-center">
        <div
          className={
            "fixed inset-0 z-[0] h-svh w-svw bg-faded-black dark:bg-faded-white"
          }
        ></div>
        <PageClient
          target={{
            relationTo: "posts",
            value: post.id,
            disabled: post.disabled,
            author: post.author.id,
            slug
          }}
        >
          <Narrateur post={post} />
        </PageClient>
        <div
          className="relative"
          style={{
            backgroundImage: `linear-gradient(to bottom, oklch(var(--faded-bg)/1) 22%, oklch(var(--faded-bg)/0.95) 35%, oklch(var(--faded-bg)/0.6) 58%, oklch(var(--faded-bg)/0.2) 65%, oklch(var(--faded-bg)/0.05) 82%, oklch(var(--faded-bg)/0.001) 96%)`,
            zIndex: 100,
            height: "20vh",
            width: "100vw",
            top: "0px",
            marginTop: "0px",
            marginBottom: "-5vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative"
          }}
        >
          <div className="absolute top-0 left-0 z-[50] h-px w-screen bg-gradient-to-r from-[oklch(var(--muted-faded-fg)/0.15)] from-10% via-[oklch(var(--muted-faded-fg)/0.75)] via-50% to-[oklch(var(--muted-faded-fg)/0.15)] to-90%" />
        </div>
        {<PrevNext prev={prev} next={next} />}
      </div>
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
