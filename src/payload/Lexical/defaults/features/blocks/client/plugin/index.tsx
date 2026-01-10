"use client";

import type {PluginComponent} from "@payloadcms/richtext-lexical";
import {useEditorConfigContext, useLexicalDrawer} from "@payloadcms/richtext-lexical/client";
import {
	$createParagraphNode,
	$getNodeByKey,
	$getPreviousSelection,
	$getSelection,
	$insertNodes,
	$isParagraphNode,
	$isRangeSelection,
	$isRootOrShadowRoot,
	COMMAND_PRIORITY_EDITOR
} from "@payloadcms/richtext-lexical/lexical";
import {
	useLexicalComposerContext
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
	$insertNodeToNearestRoot,
	$wrapNodeInElement,
	mergeRegister
} from "@payloadcms/richtext-lexical/lexical/utils";
import {formatDrawerSlug, useEditDepth} from "@payloadcms/ui";
import {useEffect, useState} from "react";

import type {BlockFields, BlockFieldsOptionalID} from "../../server/nodes/BlocksNode";

import {$createBlockNode, BlockNode} from "../nodes/BlocksNode";
import {$createInlineBlockNode, $isInlineBlockNode} from "../nodes/InlineBlocksNode";
import {INSERT_BLOCK_COMMAND, INSERT_INLINE_BLOCK_COMMAND} from "./commands";

export type InsertBlockPayload = BlockFieldsOptionalID;

export const BlocksPlugin: PluginComponent = () => {
	const [editor] = useLexicalComposerContext();

	const [targetNodeKey, setTargetNodeKey] = useState<null | string>(null);

	const {setCreatedInlineBlock, uuid} = useEditorConfigContext();
	const editDepth = useEditDepth();

	const drawerSlug = formatDrawerSlug({
		slug: `lexical-inlineBlocks-create-` + uuid,
		depth: editDepth
	});

	const {toggleDrawer} = useLexicalDrawer(drawerSlug, true);

	useEffect(() => {
		if (!editor.hasNodes([BlockNode])) {
			throw new Error("BlocksPlugin: BlocksNode not registered on editor");
		}

		return mergeRegister(
			editor.registerCommand<InsertBlockPayload>(
				INSERT_BLOCK_COMMAND,
				(payload: InsertBlockPayload) => {
					editor.update(() => {
						const selection = $getSelection() || $getPreviousSelection();

						if ($isRangeSelection(selection)) {
							const blockNode = $createBlockNode(payload);

							// we need to get the focus node before inserting the block node, as $insertNodeToNearestRoot can change the focus node
							const {focus} = selection;
							const focusNode = focus.getNode();
							// Insert blocks node BEFORE potentially removing focusNode, as $insertNodeToNearestRoot errors if the focusNode doesn't exist
							$insertNodeToNearestRoot(blockNode);

							// Delete the node it it's an empty paragraph
							if ($isParagraphNode(focusNode) && !focusNode.__first) {
								focusNode.remove();
							}
						}
					});

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			),
			editor.registerCommand(
				INSERT_INLINE_BLOCK_COMMAND,
				(fields) => {
					if (targetNodeKey) {
						const node = $getNodeByKey(targetNodeKey);

						if (!node || !$isInlineBlockNode(node)) {
							return false;
						}

						node.setFields(fields as BlockFields);

						setTargetNodeKey(null);
						return true;
					}

					const inlineBlockNode = $createInlineBlockNode(fields as BlockFields);
					setCreatedInlineBlock?.(inlineBlockNode);
					$insertNodes([inlineBlockNode]);
					if ($isRootOrShadowRoot(inlineBlockNode.getParentOrThrow())) {
						$wrapNodeInElement(
							inlineBlockNode,
							$createParagraphNode
						).selectEnd();
					}

					return true;
				},
				COMMAND_PRIORITY_EDITOR
			)
		);
	}, [editor, setCreatedInlineBlock, targetNodeKey, toggleDrawer]);

	return null;
};
