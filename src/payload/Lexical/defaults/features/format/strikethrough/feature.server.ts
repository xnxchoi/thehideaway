import { createServerFeature } from "@payloadcms/richtext-lexical";
import { STRIKETHROUGH } from "./markdownTransformers";

export const StrikethroughFeature = createServerFeature({
  feature: {
    ClientFeature:
      "@/payload/Lexical/defaults/features/format/strikethrough/feature.client.tsx#StrikethroughFeatureClient",

    markdownTransformers: [STRIKETHROUGH]
  },
  key: "strikethrough"
});
