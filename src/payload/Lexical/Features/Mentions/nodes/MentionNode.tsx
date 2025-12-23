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
  type SerializedLexicalNode,
  type Spread,
  DecoratorNode,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { MentionItem } from "./types";
import type { JSX } from "react";
import { MentionComponent } from "../Component/MentionComponent";

export type SerializedMentionNode = Spread<
  {
    id: string;

    data: MentionItem | string;
  },
  SerializedLexicalNode
>;

function $convertMentionElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const textContent = domNode.textContent;
  const mentionData = domNode.getAttribute("data-mention-data");
  const style = domNode.getAttribute("style");
  const id = domNode.getAttribute("data-mention-id");
  if (!mentionData) return null;
  let data: MentionItem | undefined = undefined;
  try {
    data = JSON.parse(mentionData) as MentionItem;
    if (
      !data ||
      !("id" in data) ||
      typeof data.id !== "string" ||
      !("slug" in data) ||
      typeof data.slug !== "string"
    )
      throw new Error("Required props in Mention node not found");
  } catch (e) {
    console.warn("Failed to parse data prop of mention node", e);
  }
  if (!data || !id) {
    return null;
  }
  const node = $createMentionNode({ data, id });
  return {
    node
  };
}

const mentionStyle = "background-color: oklch(from var(--bleu-500) l c h/.2)";

export class MentionNode extends DecoratorNode<JSX.Element> {
  __id: string;
  __trigger: string;
  __data: MentionItem | string;
  __style?: Partial<CSSStyleDeclaration> | null;

  constructor(data: MentionItem | string, id: string, key?: NodeKey) {
    super(key);
    this.__trigger = "@";
    this.__data = data;
    this.__id = id;
  }
  static override getType(): string {
    return "mention";
  }

  static override clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__data, node.__id, node.__key);
  }

  static override importJSON(
    serializedNode: SerializedMentionNode
  ): MentionNode {
    const data = serializedNode.data;
    const id = serializedNode.id;
    return $createMentionNode({ data, id });
  }

  override exportJSON(): SerializedMentionNode {
    const data = this.__data;
    const id = this.__id;
    return {
      id,
      data,
      type: "mention",
      version: 1
    };
  }

  override createDOM(config: EditorConfig): HTMLElement {
    return document.createElement("span");
  }
  updateDOM(
    _prevNode: unknown,
    _dom: HTMLElement,
    _config: EditorConfig
  ): boolean {
    return false;
  }
  override exportDOM(): DOMExportOutput {
    const element = document.createElement("span");
    element.setAttribute("data-mention", "true");
    const stringifiedData = JSON.stringify(this.__data);
    element.setAttribute("data-mention-data", stringifiedData);

    element.setAttribute("data-mention-id", this.__id);
    if (
      this.__data &&
      typeof this.__data === "object" &&
      "image" in this.__data &&
      typeof this.__data.image === "string"
    ) {
      element.setAttribute("data-mention-image", this.__data.image);
    }
    return { element };
  }
  getTextContent(): string {
    const self = this.getLatest();
    return typeof self.__data === "string"
      ? "ghost"
      : self.__trigger + self.__data.name;
  }
  getTrigger(): string {
    const self = this.getLatest();
    return self.__trigger;
  }
  getID(): string {
    const self = this.getLatest();
    return self.__id;
  }

  setID(id: string) {
    const self = this.getWritable();
    self.__id = id;
  }

  getData(): MentionItem | string {
    const self = this.getLatest();
    return self.__data;
  }

  setData(data: MentionItem | string) {
    const self = this.getWritable();
    self.__data = data;
  }
  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-mention-data")) {
          return null;
        }
        return {
          conversion: $convertMentionElement,
          priority: 1
        };
      }
    };
  }
  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    return <MentionComponent nodeKey={this.getKey()} data={this.getData()} />;
  }
}
export function $createMentionNode(props: {
  data: MentionItem | string;
  id: string;
}): MentionNode {
  const { data, id } = props;
  const mentionNode = new MentionNode(data, id);
  return $applyNodeReplacement(mentionNode);
}

export function $isMentionNode(
  node: LexicalNode | null | undefined
): node is MentionNode {
  return node instanceof MentionNode;
}
