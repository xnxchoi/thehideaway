import type { Metadata } from "next/types";
import React, { Suspense } from "react";
import PageClient from "./page.client";

type Args = {
  searchParams: Promise<{ q?: string }>;
};

export default function Page({ searchParams }: Args) {
  return (
    <Suspense fallback={null}>
      <SearchResults searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchResults({ searchParams }: Args) {
  const { q: initialQuery = "" } = await searchParams;
  return <PageClient initialQuery={initialQuery} />;
}

export function generateMetadata(): Metadata {
  return {
    title: "Search — The Hideaway"
  };
}
