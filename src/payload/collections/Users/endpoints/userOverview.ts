// NOTE: This file intentionally does NOT use `"use server"`. It exports a
// PayloadHandler mounted as a Payload endpoint — not a Next.js server action.
// The `"use server"` directive previously here was meaningless and only
// widened the POST-invokable surface.
import { getUserOverview } from "@/payload/collections/Posts/api/queryPostOverviews";
import { PayloadHandler } from "payload";

export const userOverviewHandler: PayloadHandler = async (req) => {
  // Require an authenticated session before answering with profile data.
  // The response is low-sensitivity (public profile summary), but the
  // previous unauthenticated path made it trivial to enumerate users.
  if (!req.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const para = req.routeParams;
  if (!para) {
    return Response.json(
      { error: "no route parameters available" },
      { status: 400 }
    );
  }
  const userId = para.id;
  if (!userId || typeof userId !== "string") {
    return Response.json(
      { error: "no valid user id provided" },
      { status: 400 }
    );
  }
  const res = await getUserOverview(userId);
  if (res) {
    return Response.json({ data: res }, { status: 200 });
  }
  return Response.json({ error: "no data found" }, { status: 404 });
};
