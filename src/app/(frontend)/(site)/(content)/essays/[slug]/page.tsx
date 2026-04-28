import { Narrateur } from "@/components/UX/Highlightr";
import { PrevNext } from "@/components/UX/Highlightr/prevNext";
import { RPage } from "@/components/UX/Transition";
import { queryPostBySlug } from "@/payload/collections/Posts/api/queryPostBySlug";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { generateMeta } from "@/utilities/generateMeta";
import type { Metadata } from "next";
import PageClient from "./page.client";

export const dynamic = "force-dynamic";

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
  const { post } = p;
  const { author, title, image } = post;
  return generateMeta({
    doc: {
      title: `${title} | @${author.name}`,
      image: !!image ? image.value.thumbnailURL || image.value.url : null
    }
  });
}
