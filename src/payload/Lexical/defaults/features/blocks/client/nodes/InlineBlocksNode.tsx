"use client";
import ObjectID from "bson-objectid";
import {
	$applyNodeReplacement,
	type EditorConfig,
	type LexicalEditor,
	type LexicalNode
} from "@payloadcms/richtext-lexical/lexical";
import React, {type JSX} from "react";

import type {
	InlineBlockFields,
	SerializedInlineBlockNode
} from "../../server/nodes/InlineBlocksNode";

import {ServerInlineBlockNode} from "../../server/nodes/InlineBlocksNode";

const InlineBlockComponent = React.lazy(() =>
	import("../componentInline/index").then((module) => ({
		default: module.InlineBlockComponent
	}))
);

export class InlineBlockNode extends ServerInlineBlockNode {
	static override clone(node: ServerInlineBlockNode): ServerInlineBlockNode {
		return super.clone(node);
	}

	static override getType(): string {
		return super.getType();
	}

	static override importJSON(
		serializedNode: SerializedInlineBlockNode
	): InlineBlockNode {
		const node = $createInlineBlockNode(serializedNode.fields);
		return node;
	}

	override decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
		return (
			<InlineBlockComponent
				cacheBuster={this.getCacheBuster()}
				className={
					config.theme.inlineBlock ?? "LexicalEditorTheme__inlineBlock"
				}
				formData={this.getFields()}
				nodeKey={this.getKey()}
			/>
		);
	}

	override exportJSON(): SerializedInlineBlockNode {
		return super.exportJSON();
	}
}

export function $createInlineBlockNode(
	fields: Exclude<InlineBlockFields, "id">
): InlineBlockNode {
	return $applyNodeReplacement(
		new InlineBlockNode({
			fields: {
				...fields,
				id: fields?.id || new ObjectID().toHexString()
			}
		})
	);
}

export function $isInlineBlockNode(
	node: InlineBlockNode | LexicalNode | null | undefined
): node is InlineBlockNode {
	return node instanceof InlineBlockNode;
}
