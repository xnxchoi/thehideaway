"use client"

import {
	BOLD_ITALIC_STAR,
	BOLD_ITALIC_UNDERSCORE,
	BOLD_STAR,
	BOLD_UNDERSCORE
} from "@/payload/Lexical/defaults/features/format/bold/markdownTransformers";
import {$isTableSelection} from "@lexical/table";
import {ToolbarGroup} from "@payloadcms/richtext-lexical";
import {
	createClientFeature,
	toolbarFormatGroupWithItems
} from "@payloadcms/richtext-lexical/client";
import {$isRangeSelection, FORMAT_TEXT_COMMAND} from "@payloadcms/richtext-lexical/lexical";
import {BoldIcon} from "lucide-react";

const toolbarGroups: ToolbarGroup[] = [
	toolbarFormatGroupWithItems([
		{
			ChildComponent: BoldIcon,
			isActive: ({selection}) => {
				if ($isRangeSelection(selection) || $isTableSelection(selection)) {
					return selection.hasFormat("bold")
				}
				return false
			},
			key: "bold",
			onSelect: ({editor}) => {
				editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")
			},
			order: 1,
		},
	]),
]

export const BoldFeatureClient = createClientFeature(({featureProviderMap}) => {
	const markdownTransformers = [BOLD_STAR, BOLD_UNDERSCORE]
	if (featureProviderMap.get("italic")) {
		markdownTransformers.push(BOLD_ITALIC_UNDERSCORE, BOLD_ITALIC_STAR)
	}

	return {
		enableFormats: ["bold"],
		markdownTransformers,
		toolbarFixed: {
			groups: toolbarGroups,
		},
		toolbarInline: {
			groups: toolbarGroups,
		},
	}
})
