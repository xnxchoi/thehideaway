import type { JSX } from "react";

export interface AnchorTrackRef {
  trackId: string;
  title?: string;
  artist?: string;
  cover?: string | null;
  duration?: number;
  url?: string;
}

interface AnchorMarkerProps {
  kind: "start" | "end";
  groupId: string;
  track: AnchorTrackRef;
}

/**
 * Invisible in-flow marker used by AmbientAudioRunner to locate anchors via
 * IntersectionObserver. Rendered by the Lexical serializer for both start
 * and end nodes.
 */
export function AnchorMarkers({
  kind,
  groupId,
  track
}: AnchorMarkerProps): JSX.Element {
  return (
    <span
      data-ambient-anchor={kind}
      data-ambient-group={groupId}
      data-ambient-track-id={track.trackId}
      data-ambient-track={JSON.stringify(track)}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: "1px",
        height: "1em",
        margin: 0,
        padding: 0,
        opacity: 0,
        pointerEvents: "none",
        verticalAlign: "baseline"
      }}
    >
      {"\u200B"}
    </span>
  );
}
