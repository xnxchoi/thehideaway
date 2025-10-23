import type { NavPreferences, PayloadRequest } from "payload";

import { cache } from "react";

export const getNavPrefs = cache(
  async (req: PayloadRequest): Promise<NavPreferences | null> => {
    return req?.user?.collection
      ? await req.payload
          .find({
            collection: "payload-preferences",
            depth: 0,
            limit: 1,
            pagination: false,
            req,
            where: {
              and: [
                {
                  key: {
                    equals: "nav"
                  }
                },
                {
                  "user.relationTo": {
                    equals: req.user.collection
                  }
                },
                {
                  "user.value": {
                    equals: req?.user?.id
                  }
                }
              ]
            }
          })
          ?.then((res) => {
            if (res.docs && res.docs[0] && res.docs[0].value) {
              return res.docs[0].value as NavPreferences;
            }
            throw new Error("No prefs");
          })
          .catch((e) => {
            req.payload.logger.error("Error while fetching prefs");
            return null;
          })
      : null;
  }
);
