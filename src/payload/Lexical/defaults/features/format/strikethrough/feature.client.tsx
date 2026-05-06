"use client";

import { $isTableSelection } from "@lexical/table";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import {
  $isRangeSelection,
  FORMAT_TEXT_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { StrikethroughIcon } from "lucide-react";

import { toolbarFormatGroupWithItems } from "../shared/toolbarFormatGroup";
import { STRIKETHROUGH } from "./markdownTransformers";

const toolbarGroups = [
  toolbarFormatGroupWithItems([
    {
      ChildComponent: StrikethroughIcon,
      isActive: ({ selection }) => {
        if ($isRangeSelection(selection) || $isTableSelection(selection)) {
          return selection.hasFormat("strikethrough");
        }
        return false;
      },
      key: "strikethrough",
      onSelect: ({ editor }) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
      },
      order: 4
    }
  ])
];

export const StrikethroughFeatureClient = createClientFeature({
  enableFormats: ["strikethrough"],
  markdownTransformers: [STRIKETHROUGH],
  toolbarFixed: {
    groups: toolbarGroups
  },
  toolbarInline: {
    groups: toolbarGroups
  }
});
