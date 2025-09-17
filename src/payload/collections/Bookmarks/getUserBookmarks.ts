"use server";
import type { User } from "@/payload-types";
import { CollectionSlug, PayloadHandler, PayloadRequest } from "payload";
import { cache } from "react";
import { bookmarkTypesRegex, validTypes } from ".";
export type UserBookmarksResponse = {
  bookmarks: User["id"][];
  count: number;
};
export const getUserBookmarks: PayloadHandler = cache(
  async (req: PayloadRequest) => {
    const { user } = req;
    const userId = req?.routeParams?.id;
    const { type } = req.query;
    const id = userId;
    if (!id)
      return Response.json(
        { error: "Provide a user to query for; a user id" },
        { status: 400 }
      );
    if (userId && typeof userId !== "string")
      return Response.json(
        { error: "Provide a valid user id" },
        { status: 400 }
      );

    if (!type || typeof type !== "string" || !bookmarkTypesRegex.test(type)) {
      return Response.json(
        {
          error:
            "Please provide a valid type-a comma separated list of: " +
            validTypes.join(",")
        },
        { status: 400 }
      );
    }
    const queryTypes = type.trim().toLowerCase().split(",");
    if (!queryTypes.every((t) => validTypes.includes(t as CollectionSlug)))
      return Response.json(
        {
          error:
            "Please provide valid types-a comma separated list containing one or more of: " +
            validTypes.join(",")
        },
        { status: 400 }
      );

    const payload = req.payload;
    const result = await payload
      .find({
        collection: "bookmarks",
        overrideAccess: true,
        where: {
          and: [
            {
              user: {
                equals: id
              }
            },
            {
              "target.relationTo": {
                in: [...queryTypes]
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
      .catch((error) =>
        Response.json({ error: error.message }, { status: 500 })
      );
    return result;
  }
);
