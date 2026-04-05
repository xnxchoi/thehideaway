import config from "@/payload.config";
import { sql } from "@payloadcms/db-postgres";
import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";

interface UserSearchResult {
  id: string;
  username: string;
  slug: string;
  name: string;
  image?: string;
  bio?: string;
  location?: string;
  rank?: number;
  similarity_score?: number;
}

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config });
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ users: [] });
  }

  try {
    // Use PostgreSQL full-text search with ranking
    const ftsResults = await payload.db.drizzle.execute<UserSearchResult[]>(
      sql`
      SELECT 
        id, username, slug, name, image, bio, location,
        ts_rank(search_vector, plainto_tsquery('simple', ${query})) as rank
      FROM users 
      WHERE 
        search_vector @@ plainto_tsquery('simple', ${query})
        AND _status = 'published'
        AND banned = false
      ORDER BY rank DESC, created_at DESC
      LIMIT 10
    `
    );

    // Fallback to trigram similarity for partial matches
    const excludeIds =
      ftsResults.length > 0
        ? ftsResults.map((u) => `'${u.id}'`).join(",")
        : "NULL";

    const similarResults = await payload.db.drizzle.execute<UserSearchResult[]>(
      sql`
      SELECT DISTINCT
        id, username, slug, name, image, bio, location,
        GREATEST(
          similarity(username, ${query}),
          similarity(name, ${query}),
          similarity(slug, ${query})
        ) as similarity_score
      FROM users
      WHERE (
        username % ${query} OR 
        name % ${query} OR 
        slug % ${query}
      )
      AND _status = 'published'
      AND banned = false
      AND id NOT IN (${sql.raw(excludeIds)})
      ORDER BY similarity_score DESC
      LIMIT ${Math.max(0, 10 - ftsResults.length)}
    `
    );

    const allResults = [...ftsResults, ...similarResults]
      .slice(0, 10)
      .map((user) => ({
        id: user.id,
        username: user.username,
        slug: user.slug,
        name: user.name,
        image: user.image,
        bio: user.bio,
        location: user.location,
        score: user.rank || user.similarity_score || 0
      }));

    return NextResponse.json({
      users: allResults,
      query,
      total: allResults.length
    });
  } catch (error) {
    // console.error("User search error:", error);

    // Fallback to basic Payload search if PostgreSQL search fails
    const users = await payload.find({
      collection: "users",
      where: {
        and: [
          {
            or: [
              { username: { contains: query } },
              { slug: { contains: query } },
              { name: { contains: query } }
            ]
          },
          { _status: { equals: "published" } },
          { banned: { not_equals: true } }
        ]
      },
      limit: 10,
      select: {
        id: true,
        username: true,
        slug: true,
        name: true,
        image: true,
        bio: true,
        location: true
      }
    });

    return NextResponse.json({
      users: users.docs,
      query,
      total: users.docs.length,
      fallback: true
    });
  }
}
