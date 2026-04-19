import type {
  SerializedLexicalNode,
  Spread
} from "@payloadcms/richtext-lexical/lexical";

export type AnchorKind = "start" | "end";

export interface AmbientTrackRef {
  trackId: string;
  title?: string;
  artist?: string;
  cover?: string | null;
  duration?: number;
  url?: string;
}

export type SerializedAmbientAnchorBase = Spread<
  {
    groupId: string;
    track: AmbientTrackRef;
  },
  SerializedLexicalNode
>;

export type SerializedAmbientAudioStartNode = Spread<
  { type: "ambientAudioStart" },
  SerializedAmbientAnchorBase
>;

export type SerializedAmbientAudioEndNode = Spread<
  { type: "ambientAudioEnd" },
  SerializedAmbientAnchorBase
>;

export const AMBIENT_START_TYPE = "ambientAudioStart" as const;
export const AMBIENT_END_TYPE = "ambientAudioEnd" as const;
