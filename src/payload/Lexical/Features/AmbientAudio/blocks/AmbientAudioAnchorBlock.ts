import type { Block } from "payload";

export const AMBIENT_AUDIO_ANCHOR_SLUG = "ambientAudioAnchor";

export type AmbientAnchorKind = "start" | "end";
export type AmbientProvider = "internal" | "youtube" | "url";

/**
 * InlineBlock schema for an ambient-audio anchor (start or end). Pairs of
 * anchors sharing a `groupId` form a region; the range between them plays the
 * resolved `source` while the reader crosses it.
 *
 * `source.track` is a real relationship — Payload populates it at read time
 * and (once no content references the track) gracefully returns null when the
 * target is deleted. The `scrubAmbientRefsOnTrackDelete` hook clears stale
 * ids so the relationship returns {}; the runtime tolerates null.
 */
export const AmbientAudioAnchorBlock: Block = {
  slug: AMBIENT_AUDIO_ANCHOR_SLUG,
  interfaceName: "AmbientAudioAnchorBlock",
  labels: {
    singular: "Ambient Audio Anchor",
    plural: "Ambient Audio Anchors"
  },
  admin: {
    components: {
      Block: {
        path: "@/payload/Lexical/Features/AmbientAudio/components/AnchorBlockComponent.tsx#AnchorBlockComponent"
      }
    }
  },
  fields: [
    {
      name: "groupId",
      type: "text",
      required: true,
      admin: { hidden: true }
    },
    {
      name: "kind",
      type: "radio",
      required: true,
      defaultValue: "start",
      options: [
        { label: "Start", value: "start" },
        { label: "End", value: "end" }
      ],
      admin: { hidden: true }
    },
    {
      name: "source",
      type: "group",
      fields: [
        {
          name: "provider",
          type: "radio",
          required: true,
          defaultValue: "internal",
          options: [
            { label: "Track", value: "internal" },
            { label: "YouTube", value: "youtube" },
            { label: "URL", value: "url" }
          ]
        },
        {
          name: "track",
          type: "relationship",
          relationTo: "tracks",
          hasMany: false,
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.provider === "internal"
          }
        },
        {
          name: "videoId",
          type: "text",
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.provider === "youtube"
          }
        },
        {
          name: "startSeconds",
          type: "number",
          min: 0,
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.provider === "youtube"
          }
        },
        {
          name: "endSeconds",
          type: "number",
          min: 0,
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.provider === "youtube"
          }
        },
        {
          name: "url",
          type: "text",
          admin: {
            condition: (_data, siblingData) =>
              siblingData?.provider === "url"
          }
        }
      ]
    },
    {
      name: "playback",
      type: "group",
      fields: [
        { name: "volume", type: "number", min: 0, max: 1 },
        { name: "loop", type: "checkbox" },
        { name: "fadeInMs", type: "number", min: 0 },
        { name: "fadeOutMs", type: "number", min: 0 }
      ]
    }
  ]
};
