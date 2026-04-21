"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";

import { AmbientAudioPlugin } from "./plugin/AmbientAudioPlugin";
import { AmbientAudioProvider } from "./store/ambientStore";

export const AmbientAudioClientFeature = createClientFeature({
  plugins: [{ Component: AmbientAudioPlugin, position: "bottom" }],
  providers: [AmbientAudioProvider]
});
