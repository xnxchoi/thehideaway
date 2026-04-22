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

import { AnchorComponent } from "../components/AnchorComponent";
import {
  AMBIENT_END_TYPE,
  type AmbientRegionData,
  type AmbientTrackRef,
  isAmbientRegionData,
  legacyTrackToRegion,
  type SerializedAmbientAudioEndNode,
  stripPopulatedRegion
} from "./types";
import {
  InlineBlockFields,
  ServerInlineBlockNode
} from "@/payload/Lexical/defaults/features/blocks/server/nodes/InlineBlocksNode";
import { AnchorComponent } from "@/payload/Lexical/Features/AmbientAudio/components/AnchorComponent";
import { AmbientAudioAnchorBlock, Track } from "@payload-types";
import ObjectID from "bson-objectid";
import { SerializedAmbientAudioNode } from "@/payload/Lexical/Features/AmbientAudio/nodes/types";

export const AMBIENT_AUDIO_NODE_TYPE = "ambientAudioAnchorNode";

type AddStr = "+";
type SubtrStr = "-";
type EqualStr = "=";
export type AddSubtractWithEqualityMaybe = `${AddStr | SubtrStr}${EqualStr}`;
export type NumericCalculate =
  | `${AddSubtractWithEqualityMaybe}${number}`
  | `${AddSubtractWithEqualityMaybe}${number}%`;
export type AmbientPlaybackOptions = {
  volume: number;
  loop: boolean;

  fadeInMs: number;
  fadeOutMs: number;
};
export type AmbienceProvider =
  NonNullable<AmbientAudioAnchorBlock>["source"]["provider"];
export type AmbienceSource<X extends AmbienceProvider = AmbienceProvider> = {
  startSeconds?: number;
  endSeconds?: number;
  track?: string | null | Track;
  url?: string | null;
  provider: X;
  videoId?: string | null;
} & {
  [T in AmbienceProvider]: T extends "internal"
    ? {
        track?: string | Track;
      }
    : T extends "youtube"
      ? {
          videoId: string;
        }
      : T extends "url "
        ? {
            url: string;
          }
        : never;
}[X];
export type AmbientAnchorData<T extends "start" | "end" = "start" | "end"> = {
  groupId: string;
  kind: T;
  source?: AmbienceSource;
  id?: string;
  playback?: Partial<AmbientPlaybackOptions>;
};
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

export class AmbientAnchorServerNode<
  T extends "start" | "end" = "start" | "end"
> extends ServerInlineBlockNode {
  __groupId: string;
  __kind: T;
  __source: {
    provider: "internal" | "youtube" | "url";
    track?: string | null | Track;
    videoId?: string | null;
    startSeconds: number;
    endSeconds: number;
    url?: string | null;
  };

  constructor({
    cacheBuster,
    fields,
    key
  }: {
    cacheBuster?: number;
    fields: Omit<InlineBlockFields<AmbientAudioAnchorBlock>, "kind"> & {
      kind: T;
    };
    key?: NodeKey;
  }) {
    super({ cacheBuster, fields, key });
    this.__groupId = fields.groupId;
    this.__kind = fields.kind;
    this.__source = {
      ...fields.source,
      startSeconds: 0,
      endSeconds: 0
    };
  }

  static override getType(): string {
    return AMBIENT_AUDIO_NODE_TYPE;
  }

  static override clone(
    node: AmbientAnchorServerNode
  ): AmbientAnchorServerNode {
    return new this({
      cacheBuster: node.__cacheBuster,
      fields: node.getFields()
    });
  }

  static override importJSON(
    serialized: SerializedAmbientAudioNode
  ): AmbientAnchorServerNode {
    const source = {
      ...((serialized.fields.source.provider === "internal" && {
        provider: "internal" as const,
        track: serialized.fields.source.track!
      }) ||
        (serialized.fields.source.provider === "youtube" && {
          provider: "youtube" as const,
          videoId: serialized.fields.source.videoId || ""
        }) || {
          provider: "url" as const,
          url: serialized.fields.source.url || ""
        }),
      startSeconds: 0,
      endSeconds: 0
    };

    return $createAmbientAudioNode({
      groupId: serialized.fields.groupId,
      playback: {
        ...serialized.fields.playback,
        volume: 1,
        loop: true,
        fadeInMs: 1200,
        fadeOutMs: 1200
      },
      kind: serialized.fields.kind,
      source
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
    element.setAttribute("data-ambient-provider", regionForDom.source.provider);
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
  override getFields(): Omit<
    InlineBlockFields<AmbientAudioAnchorBlock>,
    "kind"
  > & {
    kind: T;
  } {
    const fields =
      super.getFields() as InlineBlockFields<AmbientAudioAnchorBlock>;
    return {
      ...fields,
      kind: this.__kind
    };
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
export function $createAmbientAudioEndNode(
  props: Omit<AmbientAnchorData, "kind">
): AmbientAnchorServerNode<"end"> {
  return $createAmbientAudioNode({ ...props, kind: "end" });
}
export function $createAmbientAudioStartNode(
  props: Omit<AmbientAnchorData, "kind">
): AmbientAnchorServerNode<"start"> {
  return $createAmbientAudioNode({ ...props, kind: "start" });
}
export function $createAmbientAudioNode<
  T extends "start" | "end" = "start" | "end"
>({
  playback,
  id,
  groupId,
  kind,
  source
}: AmbientAnchorData<T>): AmbientAnchorServerNode<T> {
  return $applyNodeReplacement<AmbientAnchorServerNode<T>>(
    new AmbientAnchorServerNode({
      fields: {
        groupId,
        kind,
        id: id || ObjectID().toHexString(),
        playback: {
          fadeInMs: playback?.fadeInMs || 1200,
          fadeOutMs: playback?.fadeOutMs || 1200,
          volume: 1,
          loop: true
        },
        blockType: "ambientAudioAnchor",
        source: {
          startSeconds: 0,
          endSeconds: 0,
          ...((source && source) || {
            provider: "url",
            url: ""
          })
        }
      }
    })
  );
}

export function $isAmbientAudioEndNode(
  node: LexicalNode | null | undefined
): node is AmbientAnchorServerNode<"end"> {
  return node instanceof AmbientAnchorServerNode && node.__kind === "end";
}
