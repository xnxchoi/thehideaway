"use client";

import type { Track } from "@/payload-types";

import type {
  AmbientRegionData,
  AmbientSource,
  AnchorKind
} from "../nodes/types";
import { AnchorComponent } from "./AnchorComponent";

/**
 * Shape of an `AmbientAudioAnchor` inline block's `formData`. The block schema
 * guarantees `blockType`, `id`, `groupId`, and `kind`; `source` and `playback`
 * are optional until the author picks a track.
 */
interface AnchorBlockFormData {
  id?: string;
  blockType?: string;
  groupId: string;
  kind: AnchorKind;
  source?: {
    provider?: "internal" | "youtube" | "url";
    track?: string | Track | null;
    videoId?: string | null;
    startSeconds?: number | null;
    endSeconds?: number | null;
    url?: string | null;
  } | null;
  playback?: {
    volume?: number | null;
    loop?: boolean | null;
    fadeInMs?: number | null;
    fadeOutMs?: number | null;
  } | null;
}

interface AnchorBlockComponentProps {
  className?: string;
  formData: AnchorBlockFormData;
  nodeKey: string;
}

function resolveCover(track: Track): string | null {
  const album = track.album;
  if (!album || typeof album !== "object") return null;
  const cover = album.cover;
  if (!cover || typeof cover !== "object") return null;
  return cover.url ?? cover.sizes?.thumb?.url ?? null;
}

function trackToInternalSource(track: Track): AmbientSource {
  const staticUrl = track.filename
    ? `/track_media/${encodeURIComponent(track.filename)}`
    : (track.url ?? undefined);
  return {
    provider: "internal",
    trackId: String(track.id),
    title: track.title ?? undefined,
    artist: track.artist ?? undefined,
    url: staticUrl,
    duration: track.duration ?? undefined,
    cover: resolveCover(track),
    track
  };
}

function formDataToRegion(
  fields: AnchorBlockFormData | undefined | null
): AmbientRegionData {
  const src = fields?.source;
  const provider = src?.provider ?? "internal";

  if (provider === "youtube") {
    return {
      source: {
        provider: "youtube",
        videoId: src?.videoId ?? "",
        startSeconds: src?.startSeconds ?? undefined,
        endSeconds: src?.endSeconds ?? undefined
      },
      playback: fields?.playback
        ? {
            volume: fields.playback.volume ?? undefined,
            loop: fields.playback.loop ?? undefined,
            fadeInMs: fields.playback.fadeInMs ?? undefined,
            fadeOutMs: fields.playback.fadeOutMs ?? undefined
          }
        : undefined
    };
  }

  if (provider === "url") {
    return {
      source: {
        provider: "url",
        url: src?.url ?? ""
      },
      playback: fields?.playback
        ? {
            volume: fields.playback.volume ?? undefined,
            loop: fields.playback.loop ?? undefined,
            fadeInMs: fields.playback.fadeInMs ?? undefined,
            fadeOutMs: fields.playback.fadeOutMs ?? undefined
          }
        : undefined
    };
  }

  // internal
  const track = src?.track;
  if (track && typeof track === "object") {
    return {
      source: trackToInternalSource(track),
      playback: fields?.playback
        ? {
            volume: fields.playback.volume ?? undefined,
            loop: fields.playback.loop ?? undefined,
            fadeInMs: fields.playback.fadeInMs ?? undefined,
            fadeOutMs: fields.playback.fadeOutMs ?? undefined
          }
        : undefined
    };
  }
  return {
    source: {
      provider: "internal",
      trackId: typeof track === "string" ? track : ""
    }
  };
}

/**
 * Bridges Payload's inline-block chrome to the legacy `AnchorComponent`. The
 * block's editor renderer — invoked by `admin.components.Block` — receives the
 * raw form data and the Lexical node key; we translate once here so the visual
 * component and plugin machinery can keep its existing region-shaped API.
 */
export function AnchorBlockComponent({
  formData,
  nodeKey
}: AnchorBlockComponentProps) {
  const region = formDataToRegion(formData);
  const kind: AnchorKind = formData?.kind ?? "start";
  const groupId = formData?.groupId ?? nodeKey;
  return (
    <AnchorComponent
      kind={kind}
      nodeKey={nodeKey}
      groupId={groupId}
      region={region}
    />
  );
}
