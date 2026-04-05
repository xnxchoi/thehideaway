"use server";

import {cache} from "react";
import {getPayload} from "payload";
import config from "@payload-config";
import {randomNumber} from "@/utilities/randomNumber";

export const getThumbnail = cache(async ({ id }: { id?: string }) => {
  const payload = await getPayload({ config });
  const thumbnail = await payload
    .find({
      collection: "assets",
      where: {
        mimeType: {
	        like: "image/%"
        }
      },
      limit: 5,
      select: {
        url: true
      }
    })
    .then((r) => {
      if (r.docs.length > 0) {
        const idex = randomNumber(0, r.docs.length - 1);
        return (r.docs as { url: string; id: string }[])[idex].id;
      }
      return null;
    });
  return thumbnail;
});
