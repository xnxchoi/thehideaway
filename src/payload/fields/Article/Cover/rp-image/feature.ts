import {createServerFeature} from "@payloadcms/richtext-lexical";

export const RPImageFeature = createServerFeature({
  feature: {
    ClientFeature:
      "@/payload/fields/Article/Cover/rp-image/feature.client#RPImageFeatureClient"
  },
  key: "rpImageFeature"
});
