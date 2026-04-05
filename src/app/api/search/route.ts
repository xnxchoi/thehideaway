import type {
  SearchAPIResponse,
  SearchAPIResult
} from "@/components/UX/CommandKey/Commando";
import config from "@/payload.config";
import { roleToAuthority } from "@/payload/plugins/locker/fields/authority/utils";
import type { IndexedCollections } from "@/payload/search/beforeSync";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Where } from "payload";
import { CollectionSlug, getPayload } from "payload";

function collectionToUrl(collection: CollectionSlug, slug: string): string {
  switch (collection) {
    case "posts":
      return `/essays/${slug}`;
    case "surf":
      return `/surf/${slug}`;
    case "profile":
      return `/users/${slug}`;
    case "pages":
      return `/${slug}`;
    case "albums":
      return `/rp.fm/albums/${slug}`;
    case "playlists":
      return `/rp.fm/playlists/${slug}`;
    case "tracks":
      return `/rp.fm/tracks/${slug}`;
    default:
      return `/${slug}`;
  }
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!query || query.length < 1) {
    return NextResponse.json({
      results: [],
      query: "",
      collections: [],
      total: 0
    } satisfies SearchAPIResponse);
  }

  // Resolve current user for access control
  const { user } = await payload.auth({ headers: await headers() });

  // Access control mirrors the baseFilter defined in plugins/index.ts
  const accessWhere: Where = user
    ? {
        or: [
          { authority: { less_than_equal: roleToAuthority(user.role) } },
          { locked: { not_equals: true } },
          { "author.key": { equals: user.id } }
        ]
      }
    : {
        or: [
          { locked: { not_equals: true } },
          { authority: { less_than_equal: 1 } }
        ]
      };

  // Text match across indexed fields
  const searchWhere: Where = {
    or: [
      { title: { like: query } },
      { slug: { like: query } },
      { "meta.title": { like: query } },
      { "meta.description": { like: query } },
      { "author.name": { like: query } },
      { "category.title": { like: query } },
      { "tags.title": { like: query } }
    ]
  };

  try {
    const found = await payload.find({
      collection: "search",
      where: { and: [searchWhere, accessWhere] },
      limit,
      sort: "-score",
      depth: 0,
      overrideAccess: true
    });

    const results: SearchAPIResult[] = found.docs.map((doc) => ({
      id: doc.id,
      title: doc.title || undefined,
      slug: doc.slug,
      collection_type: doc.collection as IndexedCollections,
      url: collectionToUrl(doc.collection as IndexedCollections, doc.slug),
      score: (doc as any).score ?? doc.priority ?? 0,
      type: "content" as const,
      subtitle: doc.meta?.description || undefined
    }));

    return NextResponse.json({
      results,
      query,
      collections: [...new Set(results.map((r) => r.collection_type))],
      total: found.totalDocs
    } satisfies SearchAPIResponse);
  } catch (error) {
    payload.logger.error({ error, msg: "Search API error" });
    return NextResponse.json(
      { results: [], query, collections: [], total: 0 },
      { status: 500 }
    );
  }
}
