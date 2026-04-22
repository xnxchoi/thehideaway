import {
  $applyNodeReplacement,
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
import { type AmbientRegionData } from "./types";
import { InlineBlockNode } from "@/payload/Lexical/defaults/features/blocks/client/nodes/InlineBlocksNode";
import { AmbientAudioAnchorBlock, Track } from "@payload-types";
import { StronglyTypedLeafNode } from "@payloadcms/richtext-lexical";
import { SerializedDecoratorBlockNode } from "@payloadcms/richtext-lexical/lexical/react/LexicalDecoratorBlockNode";
import { AnchorComponent } from "@/payload/Lexical/Features/AmbientAudio/components/AnchorComponent";
import {
  $createAmbientAudioStartNode,
  AMBIENT_AUDIO_NODE_TYPE,
  AmbientAnchorData,
  AmbientPlaybackOptions
} from "@/payload/Lexical/Features/AmbientAudio/nodes/server/AmbientAudioEndNode";

export type SerializedAmbientAnchorNode = StronglyTypedLeafNode<
  SerializedDecoratorBlockNode,
  typeof AMBIENT_AUDIO_NODE_TYPE
> &
  AmbientAnchorData;
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
  return { node: $createAmbientAudioAnchorNode({ groupId, region }) };
}

export class AmbientAnchorNode extends InlineBlockNode {
  __playback: AmbientPlaybackOptions = {
    startSeconds: 0,
    endSeconds: 0,
    volume: 1,
    loop: true,
    fadeInMs: 1400,
    fadeOutMs: 1600
  };

  constructor(data: AmbientAnchorData, key?: NodeKey) {
    super();
    this.__groupId = groupId;
    this.__region = region;
  }

  static override clone(node: AmbientAnchorNode): AmbientAnchorNode {
    return new AmbientAnchorNode(node.__groupId, node.__region, node.__key);
  }

  static override importJSON(
    serialized: SerializedAmbientAnchorNode
  ): AmbientAudioStartNode {
    const maybeRegion = (serialized as SerializedAmbientAnchorNode).__region;
    const region = maybeRegion;
    return $createAmbientAudioStartNode({
      groupId: serialized.__groupId,
      region
    });
  }

  override exportJSON(): SerializedAmbientAnchorNode {
    return {
      type: AMBIENT_AUDIO_NODE_TYPE,
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

  updateDOM() {}

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

export function $createAmbientAudioAnchorNode(
  props: Omit<AmbientAudioAnchorBlock, "id">
): AmbientAnchorNode {
  return $applyNodeReplacement(
    new AmbientAnchorNode(props.groupId, props.region)
  );
}

export function $isAmbientAnchorNode(
  node: LexicalNode | null | undefined
): node is AmbientAnchorNode {
  return node instanceof AmbientAnchorNode;
}
