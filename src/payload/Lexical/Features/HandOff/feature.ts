import { createServerFeature } from "@payloadcms/richtext-lexical";

export const ContentHandOffFeature = createServerFeature({
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/HandOff/feature.client#ContentHandOffClientFeature"
  },
  key: "contentHandOffFeature"
});
