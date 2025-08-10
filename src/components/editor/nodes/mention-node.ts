/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
	$applyNodeReplacement,
	type DOMConversionMap,
	type DOMConversionOutput,
	type DOMExportOutput,
	type EditorConfig,
	type LexicalNode,
	type NodeKey,
	type SerializedTextNode,
	type Spread,
	TextNode,
} from "lexical";

export type SerializedMentionNode = Spread<
	{
		mentionName: string;
		mentionId: string;
		mentionSlug: string;
		mentionImage?: string;
	},
	SerializedTextNode
>;

function $convertMentionElement(
	domNode: HTMLElement,
): DOMConversionOutput | null {
	const textContent = domNode.textContent;
	const mentionId = domNode.getAttribute("data-lexical-mention-id");
	const mentionSlug = domNode.getAttribute("data-mention-slug");
	const mentionImage = domNode.getAttribute("data-mention-image");

	if (
		[textContent, mentionId, mentionSlug].reduce((acc, next) => {
			return acc && typeof next === "string" && next.length > 0;
		}, true)
	) {
		const node = $createMentionNode(
			textContent!,
			mentionId!,
			mentionSlug!,
			mentionImage || undefined,
		);
		return {
			node,
		};
	}

	return null;
}

const mentionStyle = "background-color: oklch(var(--bleu-500)/.2)";

export class MentionNode extends TextNode {
	__mention: string;
	__mentionId: string;
	__mentionSlug: string;
	__mentionImage?: string;

	static override getType(): string {
		return "mention";
	}

	static override clone(node: MentionNode): MentionNode {
		return new MentionNode(node.__mention, node.__text, node.__key);
	}

	static override importJSON(
		serializedNode: SerializedMentionNode,
	): MentionNode {
		const node = $createMentionNode(
			serializedNode.mentionName,
			serializedNode.mentionId,
			serializedNode.mentionSlug,
			serializedNode.mentionImage,
		);
		node.setTextContent(serializedNode.text);
		node.setFormat(serializedNode.format);
		node.setDetail(serializedNode.detail);
		node.setMode(serializedNode.mode);
		node.setStyle(serializedNode.style);
		return node;
	}

	constructor(
		mentionName: string,
		mentionId: string,
		text?: string,
		key?: NodeKey,
	) {
		super(text ?? mentionName, key);
		this.__mention = mentionName;
		this.__mentionId = mentionId;
	}

	override exportJSON(): SerializedMentionNode {
		return {
			...super.exportJSON(),
			mentionName: this.__mention,
			mentionId: this.__mentionId,
			mentionImage: this.__mentionImage,
			mentionSlug: this.__mentionSlug,
			type: "mention",
			version: 1,
		};
	}

	override createDOM(config: EditorConfig): HTMLElement {
		const dom = super.createDOM(config);
		dom.style.cssText = mentionStyle;
		dom.className = "mention";
		return dom;
	}

	override exportDOM(): DOMExportOutput {
		const element = document.createElement("span");
		element.setAttribute("data-lexical-mention", "true");
		element.setAttribute("data-lexical-mention-id", this.__mentionId);
		element.setAttribute("data-mention-slug", this.__mentionSlug);
		if (this.__mentionImage) {
			element.setAttribute("data-mention-image", this.__mentionImage);
		}
		element.textContent = this.__text;
		return {element};
	}

	static override importDOM(): DOMConversionMap | null {
		return {
			span: (domNode: HTMLElement) => {
				if (
					!domNode.hasAttribute("data-lexical-mention") ||
					!domNode.hasAttribute("data-lexical-mention-id")
				) {
					return null;
				}
				return {
					conversion: $convertMentionElement,
					priority: 1,
				};
			},
		};
	}

	override isTextEntity(): true {
		return true;
	}

	override canInsertTextBefore(): boolean {
		return false;
	}

	override canInsertTextAfter(): boolean {
		return false;
	}
}

export function $createMentionNode(
	mentionName: string,
	mentionId: string,
	mentionSlug: string,
	mentionImage?: string,
): MentionNode {
	const mentionNode = new MentionNode(
		mentionName,
		mentionId,
		mentionSlug,
		mentionImage,
	);
	mentionNode.setMode("segmented").toggleDirectionless();
	return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
	node: LexicalNode | null | undefined,
): node is MentionNode {
	return node instanceof MentionNode;
}
