/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import type {EditorConfig, LexicalNode, SerializedTextNode} from "lexical"
import {TextNode} from "lexical"

export type SerializedKeywordNode = SerializedTextNode

export class KeywordNode extends TextNode {
	static override getType(): string {
		return "keyword"
	}

	static override clone(node: KeywordNode): KeywordNode {
		return new KeywordNode(node.__text, node.__key)
	}

	static override importJSON(serializedNode: SerializedKeywordNode): KeywordNode {
		const node = $createKeywordNode(serializedNode.text)
		node.setFormat(serializedNode.format)
		node.setDetail(serializedNode.detail)
		node.setMode(serializedNode.mode)
		node.setStyle(serializedNode.style)
		return node
	}

	override exportJSON(): SerializedKeywordNode {
		return {
			...super.exportJSON(),
			type: "keyword",
			version: 1,
		}
	}

	override createDOM(config: EditorConfig): HTMLElement {
		const dom = super.createDOM(config)
		dom.style.cursor = "default"
		dom.className = "keyword text-purple-900 font-bold"
		return dom
	}

	override canInsertTextBefore(): boolean {
		return false
	}

	override canInsertTextAfter(): boolean {
		return false
	}

	override isTextEntity(): true {
		return true
	}
}

export function $createKeywordNode(keyword: string): KeywordNode {
	return new KeywordNode(keyword)
}

export function $isKeywordNode(node: LexicalNode | null | undefined): boolean {
	return node instanceof KeywordNode
}
