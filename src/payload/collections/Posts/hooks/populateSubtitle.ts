import { collectionTypeToFrontEnd } from "@/payload/collections/Posts/hooks/collectionTypeToFrontEnd";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { FrontEndCollections } from "@/stores/Routing/RP_Voyageur";
import { SerializedEditorState } from "@payloadcms/richtext-lexical/lexical";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
import { hasText } from "@payloadcms/richtext-lexical/shared";
import { capitalize } from "lodash-es";
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
    !["admin", "editor"].some((role) => user?.role === role)
  ) {
    if (!user) throw new Error("Unauthorized");
    if (operation === "create") {
      if (!data.subtitle || data.subtitle.length < 1) {
        const content = data.content;
        const author =
          data?.author &&
          (typeof data.author === "string" ? data.author : data.author.id);
        let authorName =
          typeof data.author === "object" && data.author?.displayUsername;

        if (author && !authorName) {
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
          hasText(content) &&
          convertLexicalToPlaintext({
            data: content as SerializedEditorState
          }).split("\n")[0];
        if (!contentText && authorName) {
          const counter = await payload
            .count({
              collection: collection.slug,
              where: {
                author: {
                  equals: author
                }
              }
            })
            .then((r) => r.totalDocs + 1)
            .catch((e) => {
              payload.logger.error(
                `[USER_REQUEST]: Failed to fetch count of ${collection.slug} docs by user - User: ${author}, Error: ${e}`
              );
              return 1;
            });
          contentText = `${capitalize(collectionTypeToFrontEnd(collection.slug))} #${counter} by ${authorName}`;
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
