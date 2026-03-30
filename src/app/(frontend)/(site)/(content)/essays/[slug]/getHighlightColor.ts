"use server";

import { HighlightColors, Palettes } from "@/components/UX/Highlightr/stores";
import { getPayload } from "@/lib/payload";
import { randomNumber } from "@/utilities/randomNumber";
import { DateTime } from "luxon";
import { headers } from "next/headers";

const colorsRegex = /^(BLUE|GREEN|ORANGE|YELLOW)$/;
export async function getHighlightColor(
  fallbackValue: HighlightColors = "BLUE"
) {
  let fallback = fallbackValue;
  const payload = await getPayload();
  const se = await payload.betterAuth.api.getSession({
    headers: await headers()
  });
  const user = se?.user.id;
  if (!user) throw new Error("Not authenticated");
  if (!colorsRegex.test(fallback)) {
    payload.logger.error(
      `Invalid fallback color: ${fallback}, using default: ${fallbackValue} | timestamps: ${DateTime.now().toISO()}`
    );
    fallback = Palettes[randomNumber(0, Palettes.length - 1)];
  }
  const pref = await payload
    .find({
      collection: "payload-preferences",
      where: {
        and: [
          {
            "user.value": {
              equals: user
            }
          },
          {
            key: {
              equals: "highlight-colors"
            }
          }
        ]
      },
      overrideAccess: true,
      pagination: false,
      limit: 1
    })
    .then((result) => {
      const doc = result.docs[0];
      return (doc && (doc.value as HighlightColors)) || null;
    })
    .catch((e) => {
      payload.logger.error(
        `Error fetching highlight color preference, user: ${user}, error: ${e}`
      );
      return null;
    });
  if (typeof pref === "string") return pref;

  return await payload
    .create({
      collection: "payload-preferences",
      data: {
        user: {
          value: user,
          relationTo: "users"
        },
        key: "highlight-colors",
        value: fallback
      },
      overrideAccess: true
    })
    .then((r) => r.value as HighlightColors)
    .catch((e) => {
      payload.logger.error(
        `Error creating highlight color preference, user: ${user}, error: ${e}`
      );
      return fallback;
    });
}
