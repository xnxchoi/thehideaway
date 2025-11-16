import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { RichTextField } from "payload";

const INLINE_RICH_TEXT_FIELDS = [];
export const RichTitle = (): RichTextField => {
  return {
    name: "richTitle",
    type: "richText",
    editor: lexicalEditor({
      features: ({ defaultFeatures, rootFeatures }) => []
    }),
    admin: {
      components: {
        Field: {
          path: "@/payload/fields/Article/Title/index.tsx#RichTextField"
        }
      }
    }
  };
};
