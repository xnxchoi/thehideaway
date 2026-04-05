"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { LinkPreviewNode } from "./nodes/LinkPreviewNode";
import { LinkPreviewPlugin } from "./Plugin";
import { INSERT_LINK_PREVIEW_COMMAND } from "./Plugin/commands";

export const LinkPreviewClientFeature = createClientFeature({
  nodes: [LinkPreviewNode],
  plugins: [{ Component: LinkPreviewPlugin, position: "normal" }],
  slashMenu: {
    groups: [
      {
        key: "embeds",
        title: "Embeds",
        items: [
          {
            key: "link-preview-card",
            label: "Link Preview",
            keywords: ["link", "preview", "embed", "card", "og", "opengraph"],
            onSelect({ editor }) {
              editor.dispatchCommand(INSERT_LINK_PREVIEW_COMMAND, {
                displayMode: "card"
              });
            }
          },
          {
            key: "link-preview-compact",
            label: "Compact Link",
            keywords: ["link", "compact", "chip", "inline", "url"],
            onSelect({ editor }) {
              editor.dispatchCommand(INSERT_LINK_PREVIEW_COMMAND, {
                displayMode: "compact"
              });
            }
          }
        ]
      }
    ]
  }
});
