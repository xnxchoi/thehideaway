import type { Track } from "@/payload-types";

export type AnchorKind = "start" | "end";

export type AmbientProvider = "internal" | "youtube" | "url";

export interface AmbientSourceInternal {
  provider: "internal";
  trackId: string;
  title?: string;
  artist?: string;
  cover?: string | null;
  duration?: number;
  url?: string;
  track?: Track | null;
}

export interface AmbientSourceYouTube {
  provider: "youtube";
  videoId: string;
  title?: string;
  author?: string;
  thumbnail?: string | null;
  duration?: number;
  startSeconds?: number;
  endSeconds?: number;
}

export interface AmbientSourceUrl {
  provider: "url";
  url: string;
  title?: string;
  artist?: string;
  cover?: string | null;
  duration?: number;
  mimeType?: string;
}

export type AmbientSource =
  | AmbientSourceInternal
  | AmbientSourceYouTube
  | AmbientSourceUrl;

export interface AmbientPlayback {
  volume?: number;
  loop?: boolean;
  fadeInMs?: number;
  fadeOutMs?: number;
}

/**
 * In-memory runtime region shape. The editor's `AnchorComponent` and the
 * public frontend's `AmbientAudioProvider` both consume this. Bridged to
 * and from the persisted `AmbientAudioAnchorBlock` fields via
 * `encodeRegion` / `decodeRegion` in `utils/anchors.ts`.
 */
export interface AmbientRegionData {
  source: AmbientSource;
  playback?: AmbientPlayback;
}
