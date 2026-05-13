// NOTE: This file intentionally does NOT use `"use server"`. It exports a
// PayloadHandler mounted at GET /api/series/:id/bookmarks — not a Next.js
// server action. The `PayloadRequest` argument is not serializable, so marking
// this module as a server action would be meaningless and only widen the
// POST-invokable surface.
import { PayloadHandler, PayloadRequest } from "payload";

export const getSeriesBookMarks: PayloadHandler = async (
  req: PayloadRequest
) => {
  // Require an authenticated session. Bookmark records carry the user who
  // bookmarked them; unauthenticated enumeration was a privacy leak.
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seriesId = req?.routeParams?.id;
  const id = seriesId;
  if (!id)
    return Response.json(
      { error: "Provide a series to query for; a series id" },
      { status: 400 }
    );
  if (seriesId && typeof seriesId !== "string")
    return Response.json(
      { error: "Provide a valid series id" },
      { status: 400 }
    );

  const payload = req.payload;
  const result = await payload
    .find({
      collection: "bookmarks",
      where: {
        and: [
          {
            "target.value": {
              equals: id
            }
          },
          {
            "target.relationTo": {
              equals: "series"
            }
          }
        ]
      },
      select: {
        target: true
      }
    })
    .then((result) =>
      Response.json(
        { bookmarks: result.docs, count: result.totalDocs },
        { status: 200 }
      )
    )
    .catch(() =>
      Response.json({ error: "Failed to fetch bookmarks" }, { status: 500 })
    );
  return result;
};
