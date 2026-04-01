import type { Metadata } from "next/types";
import React, { Suspense } from "react";
import PageClient from "./page.client";

type Args = {
  searchParams: Promise<{ q?: string }>;
};

export default async function Page({ searchParams: searchParamsPromise }: Args) {
  const { q: initialQuery = "" } = await searchParamsPromise;

  return (
    <Suspense fallback={null}>
      <PageClient initialQuery={initialQuery} />
    </Suspense>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: "Search — The Hideaway",
  };
}
