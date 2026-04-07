import { collectionTypeToFrontEnd } from "@/payload/collections/Posts/hooks/collectionTypeToFrontEnd";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { FrontEndCollections } from "@/stores/Routing/RP_Voyageur";
import { randomNumber } from "@/utilities/randomNumber";
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import { hasText } from "@payloadcms/richtext-lexical/shared";
import { capitalize } from "lodash-es";
import { DateTime } from "luxon";
import payload, { CollectionBeforeValidateHook } from "payload";

export const populateSubtitle: CollectionBeforeValidateHook<
  Extract<CollectionMap[FrontEndCollections], { subtitle: string }>
> = async ({ collection, operation, req, originalDoc, data, context }) => {
  if (!data) {
    return data;
  }
  const user = req.user;
  const overrideAccess = req.context.overrideAccess;
  if (
    !overrideAccess &&
    !["admin", "editor", "author"].some((role) => user?.role === role)
  ) {
    if (!user) throw new Error("Unauthorized");
    if (operation === "create") {
      if (!data?.subtitle || data?.subtitle?.length < 1) {
        const content = data.content;
        const author =
          data?.author &&
          (typeof data.author === "string" ? data.author : data.author.id);
        const coldoc = capitalize(
          collectionTypeToFrontEnd(collection.slug, "singular")
        );
        if (!author) {
          throw new Error("Author is required");
        }
        let authorName =
          typeof data.author === "object" && data.author?.displayUsername;

        if (!authorName) {
          await req.payload
            .findByID({
              collection: "users",
              id: author,
              select: {
                displayUsername: true
              }
            })
            .then(({ displayUsername }) => {
              authorName = displayUsername;
            })
            .catch((e) => {
              payload.logger.error(
                `[USER_REQUEST]: Failed to fetch author displayUsername - User: ${author}, Error: ${e}`
              );
            });
        }
        let contentText =
          (!!content &&
            typeof content === "object" &&
            hasText(content) &&
            convertLexicalToPlaintext({
              data: content as SerializedEditorState
            })?.split("\n")?.[0]) ||
          false;
        if (!contentText && authorName) {
          const payload = req.payload;
          const todayBegins = DateTime.now().set({
            hour: 0,
            minute: 0,
            second: 0,
            millisecond: 1
          });
          const counts = await payload
            .count({
              collection: collection.slug,
              overrideAccess: true,
              where: {
                and: [
                  {
                    createdAt: {
                      greater_than_equal: todayBegins.toISO()
                    }
                  },
                  {
                    createdAt: {
                      less_than: todayBegins.plus({ day: 1 }).toISO()
                    }
                  }
                ]
              }
            })
            .catch(() => {
              return { totalDocs: randomNumber(0, randomNumber(1, 22)) };
            });
          const rr = new Intl.PluralRules("en-US", { type: "ordinal" });

          const pluralMapping: Record<Intl.LDMLPluralRule, string> = {
            one: "st",
            two: "nd",
            few: "rd",
            many: "th",
            other: "th",
            zero: ""
          };
          const sfx = pluralMapping[rr.select(counts.totalDocs + 1)];
          console.log("counts", counts, "sfx", sfx);
          data.subtitle = `${counts.totalDocs + 1}${sfx} ${coldoc} of ${DateTime.now().toFormat("MMM d, yyyy")}`;
        }
        contentText && (data.subtitle = contentText.substring(0, 150) + "...");
      }
    } else if (operation === "update") {
      if (
        typeof data.subtitle !== "string" &&
        typeof data.subtitle !== "undefined"
      ) {
        if (originalDoc) {
          data.subtitle = originalDoc?.subtitle;
        } else delete data.subtitle;
      }
    }
  }

  return data;
};
