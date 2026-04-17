"use client";

import { ToolbarGroup, ToolbarGroupItem } from "@payloadcms/richtext-lexical";

export const toolbarFormatGroupWithItems = (
  items: ToolbarGroupItem[]
): ToolbarGroup => {
  return {
    type: "buttons",
    items,
    key: "format",
    order: 40
  };
};
