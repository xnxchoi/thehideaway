"use server";
import { RenderHero } from "@/blocks/heros/RenderHero";

import { RenderBlocks } from "@/blocks/RenderBlocks";
import { RPage } from "@/components/UX/Transition";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { RP_Footer } from "@/payload/globals/Footer/Component.client";
import { generateMeta } from "@/utilities/generateMeta";
import config from "@payload-config";
import type { Metadata } from "next";
import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getPayload } from "payload";
import PageClient from "./page.client";

export async function generateStaticParams() {
  const payload = await getPayload({ config });
  const pages = await payload.find({
    collection: "pages",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    select: {
      slug: true
    }
  });

  const params = pages.docs.map(({ slug }) => {
    return { slug };
  });
  params.push({ slug: "home" });
  return params;
}

type Args = {
  params: Promise<{
    slug?: string;
  }>;
};

export default async function Page({ params: paramsPromise }: Args) {
  const { slug = "" } = await paramsPromise;
  let querySlug = slug;

  if (slug.startsWith("@")) {
    redirect(`/users/${slug.slice(1, slug.length)}`);
  }
  if (slug === "") {
    querySlug = "home";
  }
  const url = `/${querySlug}`;
  const { isEnabled: draft } = await draftMode();
  const page = await queryPageBySlug({
    slug: querySlug,
    draft
  });

  if (!page) {
    return <PayloadRedirects url={url} />;
  }

  const { hero, layout, pageLayout } = page;

  return (
    <RPage type="pages" slug={[querySlug]}>
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />
      <PageClient title={page.title}>
        <RenderHero {...hero} />
        <RenderBlocks blocks={layout} />
        {pageLayout?.footerType && (
          <RP_Footer footerType={pageLayout.footerType} />
        )}
      </PageClient>
    </RPage>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { slug = "home" } = await paramsPromise;
  let querySlug = slug;
  if (slug === "") {
    querySlug = "home";
  }

  const page = await queryPageBySlug({
    draft: false,
    slug: querySlug
  });

  if (page) {
    return generateMeta({ doc: page || {} });
  } else if (slug === "" || slug === "home") {
    return {
      title: "Reception || The Hideaway",
      description: "Reception"
    };
  } else {
    return {
      title: "404...",
      description: "Not an exit"
    };
  }
}

async function queryPageBySlug({
  slug,
  draft
}: {
  slug: string;
  draft: boolean;
}) {
  // "use cache";
  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug
      }
    }
  });

  return result.docs?.[0] || null;
}
