"use client";

import { $isTableSelection } from "@lexical/table";
import { ToolbarGroup } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { SubscriptIcon } from "lucide-react";

import { toolbarFormatGroupWithItems } from "../shared/toolbarFormatGroup";

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: SubscriptIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat("subscript");
        }
        return false;
      },
      key: "subscript",
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
      },
      order: 5
    }
  ])
];

export const SubscriptFeatureClient = createClientFeature({
  enableFormats: ["subscript"],
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
});
