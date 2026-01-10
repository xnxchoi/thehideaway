"use client"

import {ToolbarGroup} from "@payloadcms/richtext-lexical";
import {
	createClientFeature,
	slashMenuBasicGroupWithItems,
	toolbarTextDropdownGroupWithItems
} from "@payloadcms/richtext-lexical/client";
import {
	$createParagraphNode,
	$getSelection,
	$isParagraphNode,
	$isRangeSelection
} from "@payloadcms/richtext-lexical/lexical";
import {$setBlocksType} from "@payloadcms/richtext-lexical/lexical/selection";
import {TextIcon} from "lucide-react";

const toolbarGroups: ToolbarGroup[] = [
	toolbarTextDropdownGroupWithItems([
		{
			ChildComponent: TextIcon,
			isActive: ({selection}) => {
				if (!$isRangeSelection(selection)) {
					return false
				}
				for (const node of selection.getNodes()) {
					if (!$isParagraphNode(node) && !$isParagraphNode(node.getParent())) {
						return false
					}
				}
				return true
			},
			key: "paragraph",
			label: ({i18n}) => {
				return i18n.t("lexical:paragraph:label2")
			},
			onSelect: ({editor}) => {
				editor.update(() => {
					const selection = $getSelection()
					$setBlocksType(selection, () => $createParagraphNode())
				})
			},
			order: 1,
		},
	]),
]

export const ParagraphFeatureClient = createClientFeature({
	slashMenu: {
		groups: [
			slashMenuBasicGroupWithItems([
				{
					Icon: TextIcon,
					key: "paragraph",
					keywords: ["normal", "paragraph", "p", "text"],
					label: ({i18n}) => {
						return i18n.t("lexical:paragraph:label")
					},
					onSelect: ({editor}) => {
						editor.update(() => {
							const selection = $getSelection()
							$setBlocksType(selection, () => $createParagraphNode())
						})
					},
				},
			]),
		],
	},
	toolbarFixed: {
		groups: toolbarGroups,
	},
	toolbarInline: {
		groups: toolbarGroups,
	},
})
