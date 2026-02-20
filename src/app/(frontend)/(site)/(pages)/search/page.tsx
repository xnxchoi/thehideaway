import type { Metadata } from "next/types";
import { getPayload, type Where } from "payload";
import config from "@payload-config";
import React from "react";

import type { CardPostData } from "@/payload/components/Card";
import { CollectionArchive } from "@/payload/components/CollectionArchive";

import PageClient from "./page.client";

type Args = {
  searchParams: Promise<{
    q: string;
  }>;
};

export default async function Page({
  searchParams: searchParamsPromise
}: Args) {
  const { q: query } = await searchParamsPromise;
  const payload = await getPayload({ config });

  let allResults: CardPostData[] = [];

  if (query) {
    // Search across multiple collections
    const searchWhere = {
      or: [
        {
          title: {
            like: query
          }
        },
        {
          "meta.description": {
            like: query
          }
        },
        {
          "meta.title": {
            like: query
          }
        },
        {
          slug: {
            like: query
          }
        }
      ]
    } as Where & {
      or: Where[];
    };

    // Search posts
    const posts = await payload.find({
      collection: "posts",
      depth: 1,
      limit: 6,
      select: {
        title: true,
        slug: true,
        category: true,
        meta: true,
        author: true,
        publishedAt: true,
        image: true
      },
      where: {
        and: [
          searchWhere,
          {
            _status: {
              equals: "published"
            }
          }
        ]
      }
    });

    // Search surf collection
    const surf = await payload.find({
      collection: "surf",
      depth: 1,
      limit: 6,
      select: {
        title: true,
        slug: true,
        category: true,
        meta: true,
        author: true,
        publishedAt: true,
        image: true
      },
      where: {
        and: [
          searchWhere,
          {
            _status: {
              equals: "published"
            }
          }
        ]
      }
    });

    // Combine results and sort by publishedAt
    allResults = [...posts.docs, ...surf.docs]
      .map((doc) => doc as unknown as CardPostData)
      .sort((a, b) => {
        const dateA = new Date(a.publishedAt || a.updatedAt).getTime();
        const dateB = new Date(b.publishedAt || b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 12); // Limit to 12 total results
  }

  return (
    <PageClient>
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1 className="sr-only">Search</h1>
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-bold">Search Results</h2>
            {query && (
              <p className="text-gray-600 dark:text-gray-400">
                Showing results for: <strong>&quot;{query}&quot;</strong>
              </p>
            )}
          </div>
        </div>
      </div>
      {allResults.length > 0 ? (
        <CollectionArchive posts={allResults} />
      ) : (
        <div className="container">
          {query ? "No results found." : "Enter a search term to find content."}
        </div>
      )}
    </PageClient>
  );
}

export function generateMetadata(): Metadata {
  return {
    title: `The Hideaway Search`
  };
}
