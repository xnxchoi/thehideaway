import { CatTitle } from "@/components/layouts/Tagged/Item";
import { TagButton } from "@/components/UX/TagButton";
import { RPage } from "@/components/UX/Transition";
import config from "@payload-config";
import type { Metadata } from "next/types";
import { getPayload } from "payload";

import PageClient from "./page.client";

export const dynamic = "force-dynamic";

type TagItem = {
  id: string;
  slug: string;
  title: string;
  tagCount?: number | null;
};

async function getAllTags(): Promise<TagItem[]> {
  const payload = await getPayload({ config });
  const res = await payload.find({
    collection: "tags",
    limit: 200,
    pagination: false,
    sort: "-tagCount",
    select: {
      slug: true,
      title: true,
      tagCount: true
    },
    overrideAccess: true
  });
  return (res.docs as TagItem[]).filter(
    (t): t is TagItem & { slug: string; title: string } =>
      Boolean(t?.slug && t?.title)
  );
}

export default async function TaggedIndexPage() {
  const tags = await getAllTags();

  return (
    <RPage type="tags" slug={["index"]}>
      <PageClient>
        <div className="relative flex w-full flex-col items-center justify-center">
          <div className="mx-auto w-full max-w-[calc(100vw-80px)] px-[20px]">
            <div className="mt-9 mb-[28px] min-lg:mt-[40px] min-lg:mb-[40px]">
              <p className="mb-[6px] font-mono text-[11px] tracking-[0.2em] text-foreground/55 uppercase">
                Topics
              </p>
              <CatTitle className="py-1 font-serif font-light">
                Explore by tag
              </CatTitle>
              <p className="mt-[10px] max-w-[60ch] text-sm leading-relaxed text-foreground/65">
                Every essay, dispatch, and letter is filed under one or more
                tags. Follow a thread of thought across writers and weeks.
              </p>
            </div>

            {tags.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span
                  aria-hidden
                  className="mb-4 font-mono text-5xl opacity-10"
                >
                  ◇
                </span>
                <p className="text-base font-light text-foreground/70">
                  No tags published yet.
                </p>
                <p className="mt-1.5 max-w-xs font-mono text-[11px] text-muted-foreground/50">
                  As essays go live and earn tags, they will appear here.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-y-3 pb-[120px]">
                {tags.map((tag) => (
                  <TagButton key={tag.slug} tag={tag} selected={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      </PageClient>
    </RPage>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Topics",
    description:
      "Browse every topic on The Hideaway — essays, dispatches, and letters sorted by tag."
  };
}
