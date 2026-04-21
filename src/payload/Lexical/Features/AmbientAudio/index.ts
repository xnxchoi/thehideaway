import { createServerFeature } from "@payloadcms/richtext-lexical";

export {
  AMBIENT_AUDIO_ANCHOR_SLUG,
  AmbientAudioAnchorBlock
} from "./blocks/AmbientAudioAnchorBlock";

export const AmbientAudioFeature = createServerFeature({
  key: "ambientAudioFeature",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/AmbientAudio/feature.client#AmbientAudioClientFeature"
  }
});
