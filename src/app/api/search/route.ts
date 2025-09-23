import { getPayload } from "payload";
import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@payloadcms/db-postgres";

interface QueryResult<T = any> {
  rows: T[];
}

type CollectionSlug =
  | "users"
  | "posts"
  | "delta"
  | "albums"
  | "tracks"
  | "playlists"
  | "categories"
  | "tags";

const collectionConfigs = {
  users: {
    table: "users",
    urlPattern: "/users/{slug}",
    selectFields: [
      "id",
      "username",
      "slug",
      "name",
      "image",
      "bio",
      "location"
    ],
    filters: "_status = 'published' AND banned = false"
  },
  posts: {
    table: "posts",
    urlPattern: "/posts/{slug}",
    selectFields: [
      "id",
      "title",
      "subtitle",
      "slug",
      "author_id",
      "published_at"
    ],
    filters: "_status = 'published'"
  },
  delta: {
    table: "delta",
    urlPattern: "/delta/{slug}",
    selectFields: [
      "id",
      "title",
      "source",
      "slug",
      "author_id",
      "published_at"
    ],
    filters: "_status = 'published'"
  },
  albums: {
    table: "albums",
    urlPattern: "/albums/{slug}",
    selectFields: ["id", "title", "artist", "slug", "cover_id", "published_at"],
    filters: "_status = 'published' AND visibility = 'public'"
  },
  tracks: {
    table: "tracks",
    urlPattern: "/tracks/{slug}",
    selectFields: ["id", "title", "artist", "slug", "album_id", "published_at"],
    filters: "_status = 'published' AND visibility = 'public'"
  },
  playlists: {
    table: "playlists",
    urlPattern: "/playlists/{slug}",
    selectFields: ["id", "title", "slug", "cover_id", "published_at"],
    filters: "_status = 'published' AND visibility = 'public'"
  },
  categories: {
    table: "categories",
    urlPattern: "/categories/{slug}",
    selectFields: ["id", "title", "description", "slug"],
    filters: "1=1"
  },
  tags: {
    table: "tags",
    urlPattern: "/tagged/{slug}",
    selectFields: ["id", "title", "slug", "author_id"],
    filters: "1=1"
  }
} as const;

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const collectionsParam = searchParams.get("collections");
  const collections =
    collectionsParam
      ?.split(",")
      .filter((c): c is CollectionSlug =>
        Object.keys(collectionConfigs).includes(c)
      ) || (Object.keys(collectionConfigs) as CollectionSlug[]);
  const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results: any[] = [];

    for (const collection of collections) {
      const config = collectionConfigs[collection];
      if (!config) continue;

      const selectFieldsStr = config.selectFields.join(", ");

      try {
        // Full-text search with mixed Korean/English support
        const ftsQuery = sql`
          SELECT 
            ${sql.raw(selectFieldsStr)},
            ts_rank(search_vector, plainto_tsquery('simple', ${sql.param(query)})) as rank,
            ${sql.param(collection)} as collection_type
          FROM ${sql.raw(config.table)}
          WHERE 
            search_vector @@ plainto_tsquery('simple', ${sql.param(query)})
            AND ${sql.raw(config.filters)}
          ORDER BY rank DESC, created_at DESC
          LIMIT ${sql.param(Math.ceil(limit / collections.length))}
        `;

        const ftsResults = (await payload.db.drizzle.execute(
          ftsQuery
        )) as QueryResult;

        // Get searchable fields for trigram similarity
        const searchableFields = config.selectFields.filter((f) =>
          ["title", "name", "username", "slug"].some((searchField) =>
            f.includes(searchField)
          )
        );

        if (searchableFields.length > 0) {
          const similarityExpression = searchableFields
            .map((f) => `similarity(${f}, ${sql.param(query)})`)
            .join(", ");

          const trigramCondition = searchableFields
            .map((f) => `${f} % ${sql.param(query)}`)
            .join(" OR ");

          const excludeIds =
            ftsResults.rows.length > 0
              ? ftsResults.rows.map((r: any) => `'${r.id}'`).join(",")
              : "NULL";

          const similarQuery = sql`
            SELECT DISTINCT
              ${sql.raw(selectFieldsStr)},
              GREATEST(${sql.raw(similarityExpression)}) as similarity_score,
              ${sql.param(collection)} as collection_type
            FROM ${sql.raw(config.table)}
            WHERE (${sql.raw(trigramCondition)})
            AND ${sql.raw(config.filters)}
            AND id NOT IN (${sql.raw(excludeIds)})
            ORDER BY similarity_score DESC
            LIMIT ${sql.param(Math.max(0, Math.ceil(limit / collections.length) - ftsResults.rows.length))}
          `;

          const similarResults = (await payload.db.drizzle.execute(
            similarQuery
          )) as QueryResult;

          // Combine and format results
          const collectionResults = [
            ...ftsResults.rows,
            ...similarResults.rows
          ].map((item: any) => ({
            ...item,
            collection: collection,
            url: config.urlPattern.replace("{slug}", item.slug || ""),
            score: item.rank || item.similarity_score || 0,
            type: "content"
          }));

          results.push(...collectionResults);
        } else {
          // Just use FTS results if no searchable fields for trigrams
          const collectionResults = ftsResults.rows.map((item: any) => ({
            ...item,
            collection: collection,
            url: config.urlPattern.replace("{slug}", item.slug || ""),
            score: item.rank || 0,
            type: "content"
          }));

          results.push(...collectionResults);
        }
      } catch (error) {
        console.error(`Search error for ${collection}:`, error);
        // Continue with other collections even if one fails
      }
    }

    // Sort all results by score and limit
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({
      results: sortedResults,
      query,
      collections: collections,
      total: sortedResults.length
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
