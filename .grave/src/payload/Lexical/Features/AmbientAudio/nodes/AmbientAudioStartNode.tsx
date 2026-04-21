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
import type { JSX } from "react";

import { AnchorComponent } from "../components/AnchorComponent";
import {
  AMBIENT_START_TYPE,
  type AmbientRegionData,
  isAmbientRegionData,
  type SerializedAmbientAudioStartNode,
  stripPopulatedRegion
} from "./types";

function parseRegionFromDOM(raw: string): AmbientRegionData | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (isAmbientRegionData(parsed)) return parsed;
    return null;
  } catch {
    return null;
  }
}

function $convertStartElement(
  domNode: HTMLElement
): DOMConversionOutput | null {
  const groupId = domNode.getAttribute("data-ambient-group");
  const rawRegion =
    domNode.getAttribute("data-ambient-region") ??
    domNode.getAttribute("data-ambient-track");
  if (!groupId || !rawRegion) return null;
  const region = parseRegionFromDOM(rawRegion);
  if (!region) return null;
  return { node: $createAmbientAudioStartNode({ groupId, region }) };
}

export class AmbientAudioStartNode extends DecoratorNode<JSX.Element> {
  __groupId: string;
  __region: AmbientRegionData;

  constructor(groupId: string, region: AmbientRegionData, key?: NodeKey) {
    super(key);
    this.__groupId = groupId;
    this.__region = region;
  }

  static override getType(): string {
    return AMBIENT_START_TYPE;
  }

  static override clone(node: AmbientAudioStartNode): AmbientAudioStartNode {
    return new AmbientAudioStartNode(node.__groupId, node.__region, node.__key);
  }

  static override importJSON(
    serialized: SerializedAmbientAudioStartNode
  ): AmbientAudioStartNode {
    const maybeRegion = (serialized as SerializedAmbientAudioStartNode)
      .__region;
    const region = maybeRegion;
    return $createAmbientAudioStartNode({
      groupId: serialized.__groupId,
      region
    });
  }

  override exportJSON(): SerializedAmbientAudioStartNode {
    return {
      type: AMBIENT_START_TYPE,
      version: 1,
      __groupId: this.__groupId,
      __region: stripPopulatedRegion(this.__region)
    };
  }

  override createDOM(_config: EditorConfig): HTMLElement {
    const el = document.createElement("span");
    el.setAttribute("data-ambient-anchor", "start");
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
    element.setAttribute("data-ambient-anchor", "start");
    element.setAttribute("data-ambient-group", this.__groupId);
    element.setAttribute("data-ambient-region", JSON.stringify(regionForDom));
    element.setAttribute("data-ambient-provider", regionForDom.source.provider);
    return { element };
  }

  static override importDOM(): DOMConversionMap | null {
    return {
      span: (domNode: HTMLElement) => {
        if (domNode.getAttribute("data-ambient-anchor") !== "start") {
          return null;
        }
        return { conversion: $convertStartElement, priority: 1 };
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

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <AnchorComponent
        kind="start"
        nodeKey={this.getKey()}
        groupId={this.getGroupId()}
        region={this.getRegion()}
      />
    );
  }
}

export function $createAmbientAudioStartNode(props: {
  groupId: string;
  region: AmbientRegionData;
}): AmbientAudioStartNode {
  return $applyNodeReplacement(
    new AmbientAudioStartNode(props.groupId, props.region)
  );
}

export function $isAmbientAudioStartNode(
  node: LexicalNode | null | undefined
): node is AmbientAudioStartNode {
  return node instanceof AmbientAudioStartNode;
}
