import configPromise from "@/payload.config";
import {PageRange} from "@/components/UX/PageRange";
import { Pagination } from "@/payload/components/Pagination";
import type { Metadata } from "next/types";
import { getPayload } from "payload";

import { RPage } from "@/components/UX/Transition";
import PageClient from "./page.client";

export default async function Page() {
  const payload = await getPayload({ config: configPromise });

  const users = await payload.find({
    collection: "users",
    depth: 1,
    limit: 12,
    overrideAccess: true,
    select: {
      slug: true
    },
    where: {
      banned: {
        not_equals: true
      }
    }
  });

  return (
    <RPage key={`users_${users.totalPages}`} type="users" slug={["users"]}>
      <PageClient>
        <div className="container mb-16">
          <div className="prose dark:prose-invert max-w-none">
            <h1>Posts</h1>
          </div>
        </div>
        <div className="container mb-8">
          <PageRange
            collection="users"
            currentPage={users.page}
            limit={12}
            totalDocs={users.totalDocs}
          />
        </div>
        <div className="container">
          {users.totalPages > 1 && users.page && (
            <Pagination page={users.page} totalPages={users.totalPages} />
          )}
        </div>
      </PageClient>
    </RPage>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: `The Hideaway Members Page`
  };
}
