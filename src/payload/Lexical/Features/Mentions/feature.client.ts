"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { MentionNode } from "./nodes/MentionNode";
import { MentionPlugin } from "./MentionPlugin";
import { MentionProvider } from "./mention-context";

export const MentionClientFeature = createClientFeature({
  nodes: [MentionNode],
  plugins: [{ Component: MentionPlugin, position: "floatingAnchorElem" }],
  providers: [MentionProvider]
});
