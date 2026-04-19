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
  AMBIENT_END_TYPE,
  type AmbientTrackRef,
  type SerializedAmbientAudioEndNode
} from "./types";

function $convertEndElement(domNode: HTMLElement): DOMConversionOutput | null {
  const groupId = domNode.getAttribute("data-ambient-group");
  const raw = domNode.getAttribute("data-ambient-track");
  if (!groupId || !raw) return null;
  try {
    const track = JSON.parse(raw) as AmbientTrackRef;
    if (!track || typeof track.trackId !== "string") return null;
    return { node: $createAmbientAudioEndNode({ groupId, track }) };
  } catch {
    return null;
  }
}

export class AmbientAudioEndNode extends DecoratorNode<JSX.Element> {
  __groupId: string;
  __track: AmbientTrackRef;

  constructor(groupId: string, track: AmbientTrackRef, key?: NodeKey) {
    super(key);
    this.__groupId = groupId;
    this.__track = track;
  }

  static override getType(): string {
    return AMBIENT_END_TYPE;
  }

  static override clone(node: AmbientAudioEndNode): AmbientAudioEndNode {
    return new AmbientAudioEndNode(node.__groupId, node.__track, node.__key);
  }

  static override importJSON(
    serialized: SerializedAmbientAudioEndNode
  ): AmbientAudioEndNode {
    return $createAmbientAudioEndNode({
      groupId: serialized.groupId,
      track: serialized.track
    });
  }

  override exportJSON(): SerializedAmbientAudioEndNode {
    return {
      type: AMBIENT_END_TYPE,
      version: 1,
      groupId: this.__groupId,
      track: this.__track
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
    element.setAttribute("data-ambient-anchor", "end");
    element.setAttribute("data-ambient-group", this.__groupId);
    element.setAttribute("data-ambient-track", JSON.stringify(this.__track));
    if (this.__track.trackId) {
      element.setAttribute("data-ambient-track-id", this.__track.trackId);
    }
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

  getTrack(): AmbientTrackRef {
    return this.getLatest().__track;
  }

  setTrack(track: AmbientTrackRef): void {
    const writable = this.getWritable();
    writable.__track = track;
  }

  decorate(_editor: LexicalEditor, _config: EditorConfig): JSX.Element {
    return (
      <AnchorComponent
        kind="end"
        nodeKey={this.getKey()}
        groupId={this.getGroupId()}
        track={this.getTrack()}
      />
    );
  }
}

export function $createAmbientAudioEndNode(props: {
  groupId: string;
  track: AmbientTrackRef;
}): AmbientAudioEndNode {
  return $applyNodeReplacement(
    new AmbientAudioEndNode(props.groupId, props.track)
  );
}

export function $isAmbientAudioEndNode(
  node: LexicalNode | null | undefined
): node is AmbientAudioEndNode {
  return node instanceof AmbientAudioEndNode;
}
