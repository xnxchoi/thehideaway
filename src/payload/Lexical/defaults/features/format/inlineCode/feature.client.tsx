"use client"

import {
	INLINE_CODE
} from "@/payload/Lexical/defaults/features/format/inlineCode/markdownTransformers";
import {$isTableSelection} from "@lexical/table"
import {ToolbarGroup} from "@payloadcms/richtext-lexical";
import {
	createClientFeature,
	toolbarFormatGroupWithItems
} from "@payloadcms/richtext-lexical/client";
import {$isRangeSelection, FORMAT_TEXT_COMMAND} from "@payloadcms/richtext-lexical/lexical"
import {CodeIcon} from "lucide-react";

const toolbarGroups: ToolbarGroup[] = [
	toolbarFormatGroupWithItems([
		{
			ChildComponent: CodeIcon,
			isActive: ({selection}) => {
				if ($isRangeSelection(selection) || $isTableSelection(selection)) {
					return selection.hasFormat("code")
				}
				return false
			},
			key: "inlineCode",
			onSelect: ({editor}) => {
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")
			},
			order: 7,
		},
	]),
]

export const InlineCodeFeatureClient = createClientFeature({
	enableFormats: ["code"],
	markdownTransformers: [INLINE_CODE],
	toolbarFixed: {
		groups: toolbarGroups,
	},
	toolbarInline: {
		groups: toolbarGroups,
	},
})
