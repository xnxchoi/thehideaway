"use client"

import {ToolbarGroup, ToolbarGroupItem} from "@payloadcms/richtext-lexical";
import {AlignLeftIcon} from "lucide-react";

export const toolbarAlignGroupWithItems = (items: ToolbarGroupItem[]): ToolbarGroup => {
	return {
		type: "dropdown",
		ChildComponent: AlignLeftIcon,
		items,
		key: "align",
		order: 30,
	}
}
