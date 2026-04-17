import { createServerFeature } from "@payloadcms/richtext-lexical";
import { ITALIC_STAR, ITALIC_UNDERSCORE } from "./markdownTransformers";

export const ItalicFeature = createServerFeature({
  feature: {
    ClientFeature: "@payloadcms/richtext-lexical/client#ItalicFeatureClient",
    markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE]
  },
  key: "italic"
});
