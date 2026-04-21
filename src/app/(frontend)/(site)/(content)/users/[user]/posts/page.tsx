import type { Metadata } from "next/types";

export const dynamic = "force-dynamic";

import { Pagination } from "@/payload/components/Pagination";

import PageClient from "./page.client";
import { RPage } from "@/components/UX/Transition";
import { TaggedItem } from "@/components/layouts/Tagged/Item";
import { queryPostOverviews } from "@/payload/collections/Posts/api/queryPostOverviews";
import { getPayload } from "payload";
import config from "@payload-config";
import { PayloadRedirects } from "@/payload/components/PayloadRedirects";
import { Link } from "@/components/core/Link/Link";

type Args = {
  params: Promise<{
    user?: string;
  }>;
};

const LIMIT = 12;

export default async function Page({ params: paramsPromise }: Args) {
  const { user = "" } = await paramsPromise;

  const url = user.startsWith("@") ? (user.split("@")[1] as string) : user;

  const payload = await getPayload({ config });
  const targetUser = await payload
    .find({
      collection: "users",
      where: {
        slug: {
          equals: url
        }
      },
      limit: 1,
      overrideAccess: true,
      depth: 0
    })
    .then((a) => a.docs[0])
    .catch(() => null);
  if (!targetUser) {
    return <PayloadRedirects url={"/404"} />;
  }

  const posts = await queryPostOverviews({
    limit: LIMIT,
    page: 1,
    overrideAccess: true,
    where: {
      author: {
        equals: targetUser.id
      }
    }
  });

  return (
    <RPage key={`posts_${posts.totalPages}`} type="users" slug={[url, "posts"]}>
      <PageClient>
        <header className="sticky top-0 z-20 border-b border-border/30 bg-background/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-6 py-5 xl:px-10">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="mb-2 font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground/60">
                  <Link
                    href={`/users/${url}`}
                    className="hover:text-foreground"
                  >
                    {targetUser.name}
                  </Link>
                  <span className="mx-2 text-muted-foreground/30">/</span>
                  Essays
                </p>
                <h1 className="text-2xl font-light tracking-tight xl:text-3xl">
                  Latest Writing
                </h1>
              </div>
              <p className="font-mono text-[11px] tabular-nums text-muted-foreground/60 xl:text-xs">
                {posts.totalDocs}{" "}
                {posts.totalDocs === 1 ? "essay" : "essays"}
              </p>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-10 xl:px-10 xl:py-14">
          {posts.docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="mb-4 font-mono text-5xl opacity-10">◦</span>
              <p className="text-base font-light text-foreground/70">
                Nothing published yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {posts.docs.map(
                ({ id, subtitle, title, author, category, tagged }) => (
                  <TaggedItem
                    key={id}
                    author={author.name}
                    title={title}
                    category={category.title}
                    subtitle={subtitle}
                    id={id}
                    tagged={tagged}
                    url={`/users/${author.slug}/posts/${id}`}
                  />
                )
              )}
            </div>
          )}
        </section>

        {posts.totalDocs > LIMIT && (
          <div className="mx-auto max-w-7xl px-6 pb-16 xl:px-10">
            <Pagination page={1} totalPages={1} />
          </div>
        )}
      </PageClient>
    </RPage>
  );
}

export async function generateMetadata({
  params: paramsPromise
}: Args): Promise<Metadata> {
  const { user = "@" } = await paramsPromise;

  const url = user.startsWith("@") ? (user.split("@")[1] as string) : user;

  return {
    title: `Latest from ${url}`,
    description: `Peek into ${url}'s thoughts in full.`
  };
}
