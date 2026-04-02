"use server";

import config from "@payload-config";
import { headers } from "next/headers";
import { getPayload } from "payload";

export async function searchQuery(query: string) {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({
    headers: await headers()
  });
  if (!user) {
  }
  const like = `%${query}%`;
  const filt = {
    like
  };
  await payload.find({
    collection: "search",
    where: {
      or: [
        {
          title: {
            like
          }
        },
        {
          description: filt
        },
        {
          slug: filt
        },
        {
          "author.name": filt
        },
        {
          "category.name": filt
        }
      ]
    },
    limit: 5
  });
}
