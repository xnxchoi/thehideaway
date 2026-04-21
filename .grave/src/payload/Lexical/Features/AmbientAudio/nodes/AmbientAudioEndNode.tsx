import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey
} from "@payloadcms/richtext-lexical/lexical";

import { AnchorComponent } from "../components/AnchorComponent";
import {
  AMBIENT_END_TYPE,
  isAmbientRegionData,
  legacyTrackToRegion,
  stripPopulatedRegion,
  type AmbientRegionData,
  type AmbientTrackRef,
  type LegacySerializedAmbientAnchor,
  type SerializedAmbientAudioEndNode
} from "./types";
import { JSX } from "react";

function parseRegionFromDOM(raw: string): AmbientRegionData | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isAmbientRegionData(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      const maybeTrack = parsed as AmbientTrackRef;
      if (typeof maybeTrack.trackId === "string") {
        return legacyTrackToRegion(maybeTrack);
      }
    }
    return null;
  } catch {
    return null;
  }
}

function $convertEndElement(domNode: HTMLElement): DOMConversionOutput | null {
  const groupId = domNode.getAttribute("data-ambient-group");
  const rawRegion =
    domNode.getAttribute("data-ambient-region") ??
    domNode.getAttribute("data-ambient-track");
  if (!groupId || !rawRegion) return null;
  const region = parseRegionFromDOM(rawRegion);
  if (!region) return null;
  return { node: $createAmbientAudioEndNode({ groupId, region }) };
}

export class AmbientAudioEndNode extends DecoratorNode<JSX.Element> {
  __groupId: string;
  __region: AmbientRegionData;

  constructor(groupId: string, region: AmbientRegionData, key?: NodeKey) {
    super(key);
    this.__groupId = groupId;
    this.__region = region;
  }

  static override getType(): string {
    return AMBIENT_END_TYPE;
  }

  static override clone(node: AmbientAudioEndNode): AmbientAudioEndNode {
    return new AmbientAudioEndNode(node.__groupId, node.__region, node.__key);
  }

  static override importJSON(
    serialized: SerializedAmbientAudioEndNode
  ): AmbientAudioEndNode {
    const maybeRegion = (serialized as SerializedAmbientAudioEndNode).__region;
    return $createAmbientAudioEndNode({
      groupId: serialized.__groupId,
      region: maybeRegion
    });
  }

  override exportJSON(): SerializedAmbientAudioEndNode {
    return {
      type: AMBIENT_END_TYPE,
      version: 1,
      __groupId: this.__groupId,
      __region: stripPopulatedRegion(this.__region)
    };
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("span");
    el.setAttribute("data-ambient-anchor", "end");
    el.setAttribute("data-ambient-group", this.__groupId);
    return el;
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
    const regionForDom = stripPopulatedRegion(this.__region);
    element.setAttribute("data-ambient-anchor", "end");
    element.setAttribute("data-ambient-group", this.__groupId);
    element.setAttribute("data-ambient-region", JSON.stringify(regionForDom));
    element.setAttribute(
      "data-ambient-provider",
      regionForDom.source.provider
    );
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-ambient-anchor") !== "end") {
          return null;
        }
        return { conversion: $convertEndElement, priority: 1 };
      }
    };
  }

  override isInline(): boolean {
    return true;
  }

  override isKeyboardSelectable(): boolean {
    return true;
  }

  override getTextContent(): string {
    return "";
  }

  getGroupId(): string {
    return this.getLatest().__groupId;
  }

  getRegion(): AmbientRegionData {
    return this.getLatest().__region;
  }

  setRegion(region: AmbientRegionData): void {
    const writable = this.getWritable();
    writable.__region = region;
  }

  decorate(
    _editor: LexicalEditor,
    _config: EditorConfig
  ): ReturnType<typeof AnchorComponent> {
    return (
      <AnchorComponent
        kind="end"
        nodeKey={this.getKey()}
        groupId={this.getGroupId()}
        region={this.getRegion()}
      />
    );
  }
}

export function $createAmbientAudioEndNode(props: {
  groupId: string;
  region: AmbientRegionData;
}): AmbientAudioEndNode {
  return $applyNodeReplacement(
    new AmbientAudioEndNode(props.groupId, props.region)
  );
}

export function $isAmbientAudioEndNode(
  node: LexicalNode | null | undefined
): node is AmbientAudioEndNode {
  return node instanceof AmbientAudioEndNode;
}
