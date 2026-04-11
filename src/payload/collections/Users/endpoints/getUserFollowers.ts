"use server";
import { PayloadHandler, PayloadRequest } from "payload";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export const getUserFollowers: PayloadHandler = async (req: PayloadRequest) => {
  // Require an authenticated session to view social graph. This prevents
  // anonymous scraping of followers lists.
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = req.routeParams?.id;
  if (!id || typeof id !== "string" || !UUID_RE.test(id)) {
    return Response.json({ error: "Invalid user id" }, { status: 400 });
  }

  const url = new URL(req.url ?? "", "http://internal");
  const pageParam = Number(url.searchParams.get("page") ?? 1);
  const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);

  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
  const limit =
    Number.isFinite(limitParam) && limitParam >= 1
      ? Math.min(Math.floor(limitParam), MAX_LIMIT)
      : DEFAULT_LIMIT;

  try {
    const result = await req.payload.find({
      collection: "follows",
      limit,
      page,
      where: {
        target: {
          equals: id,
        },
      },
      select: {
        user: true,
      },
    });

    const followers = result.docs.flatMap((doc) =>
      typeof doc.user === "string" ? doc.user : doc.user?.id || []
    );

    return Response.json(
      {
        followers,
        count: followers.length,
        totalDocs: result.totalDocs,
        page: result.page,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
      },
      { status: 200 }
    );
  } catch (error) {
    req.payload.logger.error({ err: error }, "getUserFollowers failed");
    return Response.json({ error: "Failed to fetch followers" }, { status: 500 });
  }
};
