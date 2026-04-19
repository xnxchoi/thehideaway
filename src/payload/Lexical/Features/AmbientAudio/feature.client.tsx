"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";

import { AmbientAudioEndNode } from "./nodes/AmbientAudioEndNode";
import { AmbientAudioStartNode } from "./nodes/AmbientAudioStartNode";
import { AmbientAudioPlugin } from "./plugin/AmbientAudioPlugin";
import { AmbientAudioProvider } from "./store/ambientStore";

export const AmbientAudioClientFeature = createClientFeature({
  nodes: [AmbientAudioStartNode, AmbientAudioEndNode],
  plugins: [{ Component: AmbientAudioPlugin, position: "bottom" }],
  providers: [AmbientAudioProvider]
});
