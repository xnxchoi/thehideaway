import { createNode, createServerFeature } from "@payloadcms/richtext-lexical";
import { LinkPreviewNode } from "./nodes/LinkPreviewNode";

export const LinkPreviewFeature = createServerFeature({
  key: "linkPreview",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/LinkPreview/feature.client.ts#LinkPreviewClientFeature",
    nodes: [createNode({ node: LinkPreviewNode })]
  }
});
