"use client"

import {$isTableSelection} from "@lexical/table"
import { ToolbarGroup } from "@payloadcms/richtext-lexical";
import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import {$isRangeSelection, FORMAT_TEXT_COMMAND} from "lexical"
import { ItalicIcon } from "lucide-react";

import {toolbarFormatGroupWithItems} from "../shared/toolbarFormatGroup"
import {ITALIC_STAR, ITALIC_UNDERSCORE} from "./markdownTransformers"

const toolbarGroups: ToolbarGroup[] = [
	toolbarFormatGroupWithItems([
		{
			ChildComponent: ItalicIcon,
			isActive: ({selection}) => {
				if ($isRangeSelection(selection) || $isTableSelection(selection)) {
					return selection.hasFormat("italic")
				}
				return false
			},
			key: "italic",
			onSelect: ({editor}) => {
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")
			},
			order: 2,
		},
	]),
]

export const ItalicFeatureClient = createClientFeature({
	enableFormats: ["italic"],
	markdownTransformers: [ITALIC_STAR, ITALIC_UNDERSCORE],
	toolbarFixed: {
		groups: toolbarGroups,
	},
	toolbarInline: {
		groups: toolbarGroups,
	},
})
