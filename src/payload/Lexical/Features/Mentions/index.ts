import { createNode, createServerFeature } from "@payloadcms/richtext-lexical";
import { MentionNode } from "./nodes/MentionNode";

export const MentionFeature = createServerFeature({
  key: "mentionFeature",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/Mentions/feature.client.ts#MentionClientFeature",
    nodes: [createNode({ node: MentionNode })]
  }
});
