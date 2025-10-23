import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { RichTextField } from "payload";

const INLINE_RICH_TEXT_FIELDS = ["toolbarInline", "bold", "italic"];
export const RichTitle = (): RichTextField => {
  return {
    name: "richTitle",
    type: "richText",
    editor: lexicalEditor({
      features: ({ defaultFeatures }) => [
        ...defaultFeatures.filter(({ key }) =>
          INLINE_RICH_TEXT_FIELDS.includes(key)
        )
      ]
    }),
    admin: {
      components: {
        Field: {
          path: "@/payload/fields/ArticleTitleField/index.tsx#RichTextField"
        }
      }
    }
  };
};
