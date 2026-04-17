"use client";

import { $isTableSelection } from "@lexical/table";
import { ToolbarGroup } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { $isRangeSelection, FORMAT_TEXT_COMMAND } from "lexical";
import { SuperscriptIcon } from "lucide-react";

import { toolbarFormatGroupWithItems } from "../shared/toolbarFormatGroup";

const toolbarGroups: ToolbarGroup[] = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: SuperscriptIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat("superscript");
        }
        return false;
      },
      key: "superscript",
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
      },
      order: 6
    }
  ])
];

export const SuperscriptFeatureClient = createClientFeature({
  enableFormats: ["superscript"],
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
});
