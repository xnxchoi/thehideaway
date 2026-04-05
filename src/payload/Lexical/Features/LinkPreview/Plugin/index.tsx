"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR
} from "@payloadcms/richtext-lexical/lexical";
import { useEffect } from "react";
import {
  $createLinkPreviewNode,
  type LinkPreviewDisplayMode
} from "../nodes/LinkPreviewNode";
import { INSERT_LINK_PREVIEW_COMMAND } from "./commands";

export function LinkPreviewPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<{
      url?: string;
      displayMode?: LinkPreviewDisplayMode;
    }>(
      INSERT_LINK_PREVIEW_COMMAND,
      (payload) => {
        const previewNode = $createLinkPreviewNode({
          url: payload?.url ?? "",
          displayMode: payload?.displayMode ?? "card"
        });

        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const topBlock = anchorNode.getTopLevelElement();
          if (topBlock) {
            topBlock.insertAfter(previewNode);
          } else {
            $getRoot().append(previewNode);
          }
        } else {
          const root = $getRoot();
          const last = root.getLastChild();
          if (last) {
            last.insertAfter(previewNode);
          } else {
            root.append(previewNode);
          }
        }

        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
