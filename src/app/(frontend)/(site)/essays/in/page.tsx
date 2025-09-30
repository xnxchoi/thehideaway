import type { Metadata } from "next/types";

import PostsPage from "./[pageNumber]/page";

export default async function Page() {
  return (
    <PostsPage
      params={
        new Promise<{ pageNumber: string }>((resolve) =>
          resolve({ pageNumber: "1" })
        )
      }
    />
  );
}

export function generateMetadata(): Metadata {
  return {
    title: `Articles & Essays`,
    description: `The latest heard around the estate.`
  };
}
