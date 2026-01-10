"use client";
import {
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import React, {type JSX} from "react";
import {uuidv7} from "uuidv7";

import type {BlockFieldsOptionalID, SerializedBlockNode} from "../../server/nodes/BlocksNode";
import {ServerBlockNode} from "../../server/nodes/BlocksNode";
import {BlockComponent} from "../component/index";

export class BlockNode extends ServerBlockNode {
	static override clone(node: ServerBlockNode): ServerBlockNode {
		return super.clone(node);
	}

	static override getType(): string {
		return super.getType();
	}

	static override importJSON(serializedNode: SerializedBlockNode): BlockNode {
		if (serializedNode.version === 1) {
			// Convert (version 1 had the fields wrapped in another, unnecessary data property)
			serializedNode = {
				...serializedNode,
				fields: {
					...(serializedNode as any).fields.data
				},
				version: 2
			};
		}
		const node = $createBlockNode(serializedNode.fields);
		node.setFormat(serializedNode.format);
		return node;
	}

	override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
		return (
			<BlockComponent
				cacheBuster={this.getCacheBuster()}
				className={config.theme.block ?? "LexicalEditorTheme__block"}
				formData={this.getFields()}
				nodeKey={this.getKey()}
			/>
		);
	}

	override exportJSON(): SerializedBlockNode {
		return super.exportJSON();
	}
}

export function $createBlockNode(fields: BlockFieldsOptionalID): BlockNode {
	return $applyNodeReplacement(
		new BlockNode({
			fields: {
				...fields,
				id: fields?.id || uuidv7()
			}
		})
	);
}

export function $isBlockNode(
	node: BlockNode | LexicalNode | null | undefined
): node is BlockNode {
	return node instanceof BlockNode;
}
