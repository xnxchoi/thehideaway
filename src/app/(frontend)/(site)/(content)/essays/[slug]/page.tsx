import { Narrateur } from "@/components/UX/Highlightr";
import { PrevNext } from "@/components/UX/Highlightr/prevNext";
import { RPage } from "@/components/UX/Transition";
import { queryPostBySlug } from "@/payload/collections/Posts/api/queryPostBySlug";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { generateMeta } from "@/utilities/generateMeta";
import configPromise from "@payload-config";
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { getPayload } from "payload";
import { Suspense } from "react";
import PageClient from "./page.client";

type Args = {
  params: Promise<{
    slug?: string;
  }>;
};

export default function Post({ params }: Args) {
  return (
    <Suspense>
      <PostBody params={params} />
    </Suspense>
  );
}

async function PostBody({ params }: Args) {
  const { slug } = await params;
  if (!slug) {
    return <></>;
  }
  if (slug.length < 1) return <PayloadRedirects url={"/home"} />;
  const p = await queryPostBySlug({ slug });
  if (!p) return <PayloadRedirects url={"/home"} />;
  const { post, prev, next, gate } = p;

  return (
    <RPage type={"posts"} slug={[slug]} key={slug}>
      <PageClient post={post}>
        <Narrateur post={post} />
      </PageClient>
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 h-svh w-svw bg-faded-white dark:bg-faded-black"
      ></div>
      {gate.readable ? <PrevNext prev={prev} next={next} /> : null}
    </RPage>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug: encoded = "" } = await paramsPromise;
  return getPostMetadata(decodeURIComponent(encoded));
}

async function getPostMetadata(slug: string) {
  "use cache";
  cacheTag("posts-sitemap");
  cacheLife("hours");
  const payload = await getPayload({ config: configPromise });
  const post = await payload
    .find({
      collection: "posts",
      draft: false,
      limit: 1,
      pagination: false,
      overrideAccess: true,
      depth: 1,
      where: {
        slug: {
          equals: slug
        }
      },
      select: {
        title: true,
        slug: true,
        author: true
      }
    })
    .then((result) => result.docs[0] ?? null);

  if (!post) {
    return {
      title: "The Hideaway",
      description: "The Hideaway"
    };
  }

  const authorName =
    typeof post.author === "object" &&
    post.author !== null &&
    "name" in post.author
      ? post.author.name
      : null;

  return generateMeta({
    doc: {
      title: authorName ? `${post.title} | @${authorName}` : post.title
    }
  });
}
