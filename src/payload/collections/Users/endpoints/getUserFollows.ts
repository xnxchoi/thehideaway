"use server";
import { PayloadHandler, PayloadRequest } from "payload";
import { User } from "better-auth";
import { cache } from "react";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export type UserFollowingResponse = {
  follows: User["id"][];
  count: number;
  totalDocs?: number;
  page?: number;
  totalPages?: number;
  hasNextPage?: boolean;
};

export const getUserFollowing: PayloadHandler = cache(
  async (req: PayloadRequest) => {
    // Require an authenticated session to view the social graph.
    if (!req.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = req?.routeParams?.id ?? req.user?.id;
    if (!userId) {
      return Response.json(
        { error: "Provide a user to query for; a user id" },
        { status: 400 }
      );
    }
    if (typeof userId !== "string" || !UUID_RE.test(userId)) {
      return Response.json({ error: "Provide a valid user id" }, { status: 400 });
    }

    const url = new URL(req.url ?? "", "http://internal");
    const pageParam = Number(url.searchParams.get("page") ?? 1);
    const limitParam = Number(url.searchParams.get("limit") ?? DEFAULT_LIMIT);

    const page =
      Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;
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
          user: {
            equals: userId,
          },
        },
        select: {
          target: true,
        },
      });

      const following = result.docs.map((doc) => doc.target);

      return Response.json(
        {
          following,
          count: following.length,
          totalDocs: result.totalDocs,
          page: result.page,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
        },
        { status: 200 }
      );
    } catch (error) {
      req.payload.logger.error({ err: error }, "getUserFollowing failed");
      return Response.json(
        { error: "Failed to fetch following" },
        { status: 500 }
      );
    }
  }
);
