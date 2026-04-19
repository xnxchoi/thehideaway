import { createNode, createServerFeature } from "@payloadcms/richtext-lexical";

import { AmbientAudioEndNode } from "./nodes/AmbientAudioEndNode";
import { AmbientAudioStartNode } from "./nodes/AmbientAudioStartNode";

export const AmbientAudioFeature = createServerFeature({
  key: "ambientAudioFeature",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/AmbientAudio/feature.client#AmbientAudioClientFeature",
    nodes: [
      createNode({ node: AmbientAudioStartNode }),
      createNode({ node: AmbientAudioEndNode })
    ]
  }
});
