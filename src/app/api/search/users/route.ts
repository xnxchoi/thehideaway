import config from "@/payload.config";
import { rateLimitOr429 } from "@/lib/api/rateLimit";
import { sql } from "@payloadcms/db-postgres";
import { headers as nextHeaders } from "next/headers";
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

const MAX_QUERY_LENGTH = 100;

export async function GET(request: NextRequest) {
  const payload = await getPayload({ config });

  // Require an authenticated session. The previous unauthenticated behaviour
  // let any external actor enumerate the entire user directory (handle, bio,
  // location) via a trigram-similarity scan over the alphabet.
  const { user } = await payload.auth({ headers: await nextHeaders() });
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimitOr429(request, "search", String(user.id));
  if (rl) return rl;

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("q");
  const query = rawQuery?.trim().slice(0, MAX_QUERY_LENGTH) ?? "";

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

    // Fallback to trigram similarity for partial matches.
    // Build the NOT IN clause with parameterized values (no sql.raw) so
    // there is no interpolated-string SQL surface, even though ids come
    // from the DB rather than from user input.
    const excludeClause =
      ftsResults.length > 0
        ? sql`AND id NOT IN (${sql.join(
            ftsResults.map((u) => sql`${u.id}`),
            sql.raw(", ")
          )})`
        : sql``;

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
      ${excludeClause}
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
