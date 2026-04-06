import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread
} from "@payloadcms/richtext-lexical/lexical";
import type { JSX } from "react";
import { LinkPreviewComponent } from "../Component/LinkPreviewComponent";

export type LinkPreviewDisplayMode = "card" | "compact";

export type SerializedLinkPreviewNode = Spread<
  {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    displayMode: LinkPreviewDisplayMode;
  },
  SerializedLexicalNode
>;

export class LinkPreviewNode extends DecoratorNode<JSX.Element> {
  __url: string;
  __title: string | null;
  __description: string | null;
  __image: string | null;
  __siteName: string | null;
  __displayMode: LinkPreviewDisplayMode;

  constructor(
    url: string,
    displayMode: LinkPreviewDisplayMode = "card",
    title: string | null = null,
    description: string | null = null,
    image: string | null = null,
    siteName: string | null = null,
    key?: NodeKey
  ) {
    super(key);
    this.__url = url;
    this.__displayMode = displayMode;
    this.__title = title;
    this.__description = description;
    this.__image = image;
    this.__siteName = siteName;
  }

  static override getType(): string {
    return "link-preview";
  }

  static override clone(node: LinkPreviewNode): LinkPreviewNode {
    return new LinkPreviewNode(
      node.__url,
      node.__displayMode,
      node.__title,
      node.__description,
      node.__image,
      node.__siteName,
      node.__key
    );
  }

  static override importJSON(
    serialized: SerializedLinkPreviewNode
  ): LinkPreviewNode {
    return $createLinkPreviewNode({
      url: serialized.url,
      displayMode: serialized.displayMode,
      title: serialized.title,
      description: serialized.description,
      image: serialized.image,
      siteName: serialized.siteName
    });
  }

  override exportJSON(): SerializedLinkPreviewNode {
    return {
      type: "link-preview",
      version: 1,
      url: this.__url,
      displayMode: this.__displayMode,
      title: this.__title,
      description: this.__description,
      image: this.__image,
      siteName: this.__siteName
    };
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.setAttribute("data-lexical-link-preview", "true");
    return div;
  }

  override updateDOM(): boolean {
    return false;
  }

  override exportDOM(): DOMExportOutput {
    const element = document.createElement("div");
    element.setAttribute("data-link-preview", "true");
    element.setAttribute("data-url", this.__url);
    element.setAttribute("data-display-mode", this.__displayMode);
    if (this.__title) element.setAttribute("data-title", this.__title);
    if (this.__description)
      element.setAttribute("data-description", this.__description);
    if (this.__image) element.setAttribute("data-image", this.__image);
    if (this.__siteName)
      element.setAttribute("data-site-name", this.__siteName);
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      div: (domNode: HTMLElement) => {
        if (!domNode.hasAttribute("data-link-preview")) return null;
        return {
          conversion: $convertLinkPreviewElement,
          priority: 2
        };
      }
    };
  }

  // Block-level in both modes; display mode only affects visual rendering
  override isInline(): boolean {
    return false;
  }

  getUrl(): string {
    return this.getLatest().__url;
  }

  setUrl(url: string): void {
    this.getWritable().__url = url;
  }

  getDisplayMode(): LinkPreviewDisplayMode {
    return this.getLatest().__displayMode;
  }

  setDisplayMode(mode: LinkPreviewDisplayMode): void {
    this.getWritable().__displayMode = mode;
  }

  getTitle(): string | null {
    return this.getLatest().__title;
  }

  setTitle(title: string | null): void {
    this.getWritable().__title = title;
  }

  getDescription(): string | null {
    return this.getLatest().__description;
  }

  setDescription(description: string | null): void {
    this.getWritable().__description = description;
  }

  getImage(): string | null {
    return this.getLatest().__image;
  }

  setImage(image: string | null): void {
    this.getWritable().__image = image;
  }

  getSiteName(): string | null {
    return this.getLatest().__siteName;
  }

  setSiteName(siteName: string | null): void {
    this.getWritable().__siteName = siteName;
  }

  override getTextContent(): string {
    return this.__title ?? this.__url;
  }

  override decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <LinkPreviewComponent
        nodeKey={this.getKey()}
        url={this.__url}
        title={this.__title}
        description={this.__description}
        image={this.__image}
        siteName={this.__siteName}
        displayMode={this.__displayMode}
      />
    );
  }
}

function $convertLinkPreviewElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const url = domNode.getAttribute("data-url");
  if (!url) return null;
  const node = $createLinkPreviewNode({
    url,
    displayMode:
      (domNode.getAttribute("data-display-mode") as LinkPreviewDisplayMode) ??
      "card",
    title: domNode.getAttribute("data-title"),
    description: domNode.getAttribute("data-description"),
    image: domNode.getAttribute("data-image"),
    siteName: domNode.getAttribute("data-site-name")
  });
  return { node };
}

export function $createLinkPreviewNode(props: {
  url: string;
  displayMode?: LinkPreviewDisplayMode;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  siteName?: string | null;
}): LinkPreviewNode {
  return $applyNodeReplacement(
    new LinkPreviewNode(
      props.url,
      props.displayMode ?? "card",
      props.title ?? null,
      props.description ?? null,
      props.image ?? null,
      props.siteName ?? null
    )
  );
}

export function $isLinkPreviewNode(
  node: LexicalNode | null | undefined
): node is LinkPreviewNode {
  return node instanceof LinkPreviewNode;
}
