"use client";

import { createClientFeature } from "@payloadcms/richtext-lexical/client";
import { PasteConverterPlugin } from "./PasteConverterPlugin";

export const FormatImportClientFeature = createClientFeature({
  plugins: [{ Component: PasteConverterPlugin, position: "normal" }]
});
