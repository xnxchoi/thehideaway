import {
  $applyNodeReplacement,
  $createParagraphNode,
  $getRoot,
  DOMConversionMap,
  DOMExportOutput,
  EditorConfig,
  ElementNode,
  isHTMLElement,
  LexicalEditor,
  LexicalNode,
  LexicalUpdateJSON,
  NodeKey,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  Spread
} from "lexical";
import {
  $createHeadingNode,
  HeadingTagType,
  SerializedHeadingNode,
  type HeadingNode
} from "@lexical/rich-text";
import { addClassNamesToElement } from "@lexical/utils";

export class StickyHeadingNode extends ElementNode {
  __tag: HeadingTagType;

  constructor(tag: HeadingTagType, key?: NodeKey) {
    super(key);
    this.__tag = tag;
  }

  getTag(): HeadingTagType {
    return this.__tag;
  }

  setTag(tag: HeadingTagType): this {
    const self = this.getWritable();
    this.__tag = "h3";
    return self;
  }

  override createDOM(config: EditorConfig): HTMLElement {
    const tag = this.__tag;
    const element = document.createElement(tag);
    const theme = config.theme;
    element.setAttribute("data-lexical-root-heading", "true");
    const classNames = theme.heading;
    if (classNames !== undefined) {
      const className = classNames[tag];
      addClassNamesToElement(element, className);
    }
    return element;
  }

  override updateDOM(
    prevNode: this,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    return prevNode.__tag !== this.__tag;
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      h1: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      h2: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      h3: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      h4: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      h5: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      h6: (node) => {
        if (!node.hasAttribute("data-lexical-root-heading")) {
          return null;
        }
        return {
          conversion: $convertStickyHeadingElement,
          priority: 0
        };
      },
      p: (node) => {
        // domNode is a <p> since we matched it by nodeName
        const paragraph = node;
        const firstChild = paragraph.firstChild as HTMLElement;
        if (
          node.hasAttribute("data-lexical-root-heading") ||
          (firstChild !== null && isGoogleDocsTitle(firstChild))
        ) {
          return {
            conversion: () => ({
              node: null
            }),
            priority: 0
          };
        }
        return null;
      },
      span: (node) => {
        if (
          node.hasAttribute("data-lexical-root-heading") ||
          isGoogleDocsTitle(node)
        ) {
          return {
            conversion: (domNode) => {
              return {
                node: $createStickyHeadingNode("h3")
              };
            },
            priority: 0
          };
        }
        return null;
      }
    };
  }

  override exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    if (isHTMLElement(element)) {
      if (this.isEmpty()) {
        element.append(document.createElement("br"));
      }
      const formatType = this.getFormatType();
      element.style.textAlign = formatType;
      const direction = this.getDirection();
      if (direction) {
        element.dir = direction;
      }
    }
    return {
      element
    };
  }

  static override importJSON(
    serializedNode: SerializedHeadingNode
  ): StickyHeadingNode {
    return $createStickyHeadingNode(serializedNode.tag).updateFromJSON(
      serializedNode
    );
  }

  override updateFromJSON(
    serializedNode: LexicalUpdateJSON<SerializedStickyHeadingNode>
  ): this {
    return super.updateFromJSON(serializedNode).setTag(serializedNode.tag);
  }

  override exportJSON(): SerializedStickyHeadingNode {
    return {
      ...super.exportJSON(),
      tag: this.getTag()
    };
  }

  override insertNewAfter(
    selection?: RangeSelection,
    restoreSelection?: boolean
  ): StickyHeadingNode | ParagraphNode {
    const anchorOffet: number = selection ? selection.anchor.offset : 0;
    const lastDesc: LexicalNode | null = this.getLastDescendant();
    const isAtEnd =
      !lastDesc ||
      (selection &&
        selection.anchor.key === lastDesc.getKey() &&
        anchorOffet === lastDesc.getTextContentSize());
    const newElement: ParagraphNode | StickyHeadingNode =
      isAtEnd || !selection
        ? $createParagraphNode()
        : $createStickyHeadingNode(this.getTag());
    const direction = this.getDirection();
    if (direction) {
      newElement.setDirection(direction);
    }
    this.insertAfter(newElement, restoreSelection);

    return newElement;
  }

  override collapseAtStart(): true {
    const newElement = $createStickyHeadingNode(this.getTag());

    const children = this.getChildren();
    children.forEach((child) => newElement.append(child));
    this.replace(newElement);
    return true;
  }

  override extractWithChild(): boolean {
    return true;
  }

  static override getType() {
    return "sticky-heading";
  }

  static override clone(node: StickyHeadingNode): HeadingNode {
    const content = node.getChildren();
    const newnode = $createHeadingNode(node.getTag());
    content.forEach((child) => newnode.append(child));
    return newnode;
  }

  override canInsertTextBefore(): boolean {
    return false;
  }
  override canInsertTextAfter(): boolean {
    return false;
  }
  override insertBefore(
    nodeToInsert: LexicalNode,
    restoreSelection?: boolean
  ): LexicalNode {
    this.insertAfter(nodeToInsert, restoreSelection);
    return nodeToInsert;
  }
  override remove(preserveEmptyParent?: boolean): void {
    this.clear();
  }
}

export function $createStickyHeadingNode(
  tag: HeadingTagType
): StickyHeadingNode {
  return $applyNodeReplacement(
    new StickyHeadingNode(tag) as ElementNode
  ) as StickyHeadingNode;
}

export function $isStickyHeadingNode(
  node: LexicalNode | null | undefined
): node is StickyHeadingNode {
  return node instanceof StickyHeadingNode;
}

function isGoogleDocsTitle(domNode: HTMLElement): boolean {
  return domNode.hasAttribute("data-lexical-root-heading");
}

function $convertStickyHeadingElement(element: HTMLElement) {
  const nodeName = element.nodeName.toLowerCase();
  let node: StickyHeadingNode | null = null;
  if (
    nodeName === "h1" ||
    nodeName === "h2" ||
    nodeName === "h3" ||
    nodeName === "h4" ||
    nodeName === "h5" ||
    nodeName === "h6"
  ) {
    node = $createStickyHeadingNode("h3");
  }
  return {
    node
  };
}

export type SerializedStickyHeadingNode = Spread<
  {
    tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  },
  SerializedElementNode
>;
