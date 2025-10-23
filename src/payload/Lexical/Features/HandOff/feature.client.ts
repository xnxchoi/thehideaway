"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { ContentHandOffPlugin } from "./contentHandOffPlugin";

export const ContentHandOffClientFeature = createClientFeature({
  plugins: [{ Component: ContentHandOffPlugin, position: "bottom" }]
});
