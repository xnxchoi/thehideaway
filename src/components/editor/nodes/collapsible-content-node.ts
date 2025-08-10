/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import {
	DOMConversionMap,
	DOMConversionOutput,
	DOMExportOutput,
	EditorConfig,
	ElementNode,
	LexicalEditor,
	LexicalNode,
	SerializedElementNode,
} from "lexical"

import {$isCollapsibleContainerNode} from "@/components/editor/nodes/collapsible-container-node"
import {IS_CHROME} from "@/components/editor/shared/environment"
import {invariant} from "@/components/editor/shared/invariant"
import {
	domOnBeforeMatch,
	setDomHiddenUntilFound,
} from "@/components/editor/utils/collapsible"

type SerializedCollapsibleContentNode = SerializedElementNode

export function $convertCollapsibleContentElement(
	domNode: HTMLElement
): DOMConversionOutput | null {
	const node = $createCollapsibleContentNode()
	return {
		node,
	}
}

export class CollapsibleContentNode extends ElementNode {
	static override getType(): string {
		return "collapsible-content"
	}

	static override clone(node: CollapsibleContentNode): CollapsibleContentNode {
		return new CollapsibleContentNode(node.__key)
	}

	override createDOM(config: EditorConfig, editor: LexicalEditor): HTMLElement {
		const dom = document.createElement("div")
		dom.classList.add("pt-0", "pr-1", "pb-1", "pl-4")
		if (IS_CHROME) {
			editor.getEditorState().read(() => {
				const containerNode = this.getParentOrThrow()
				invariant(
					$isCollapsibleContainerNode(containerNode),
					"Expected parent node to be a CollapsibleContainerNode"
				)
				if (!containerNode.__open) {
					setDomHiddenUntilFound(dom)
				}
			})
			domOnBeforeMatch(dom, () => {
				editor.update(() => {
					const containerNode = this.getParentOrThrow().getLatest()
					invariant(
						$isCollapsibleContainerNode(containerNode),
						"Expected parent node to be a CollapsibleContainerNode"
					)
					if (!containerNode.__open) {
						containerNode.toggleOpen()
					}
				})
			})
		}
		return dom
	}

	override updateDOM(prevNode: CollapsibleContentNode, dom: HTMLElement): boolean {
		return false
	}

	static override importDOM(): DOMConversionMap | null {
		return {
			div: (domNode: HTMLElement) => {
				if (!domNode.hasAttribute("data-lexical-collapsible-content")) {
					return null
				}
				return {
					conversion: $convertCollapsibleContentElement,
					priority: 2,
				}
			},
		}
	}

	override exportDOM(): DOMExportOutput {
		const element = document.createElement("div")
		element.classList.add("pt-0", "pr-1", "pb-1", "pl-4")
		element.setAttribute("data-lexical-collapsible-content", "true")
		return {element}
	}

	static override importJSON(
		serializedNode: SerializedCollapsibleContentNode
	): CollapsibleContentNode {
		return $createCollapsibleContentNode()
	}

	override isShadowRoot(): boolean {
		return true
	}

	override exportJSON(): SerializedCollapsibleContentNode {
		return {
			...super.exportJSON(),
			type: "collapsible-content",
			version: 1,
		}
	}
}

export function $createCollapsibleContentNode(): CollapsibleContentNode {
	return new CollapsibleContentNode()
}

export function $isCollapsibleContentNode(
	node: LexicalNode | null | undefined
): node is CollapsibleContentNode {
	return node instanceof CollapsibleContentNode
}
