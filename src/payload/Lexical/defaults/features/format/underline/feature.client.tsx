"use client";

import { $isTableSelection } from "@lexical/table";
import { ToolbarGroup } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { UnderlineIcon } from "lucide-react";

import { toolbarFormatGroupWithItems } from "../shared/toolbarFormatGroup";

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: UnderlineIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat("underline");
        }
        return false;
      },
      key: "underline",
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
      },
      order: 3
    }
  ])
];

export const UnderlineFeatureClient = createClientFeature({
  enableFormats: ["underline"],
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
});
