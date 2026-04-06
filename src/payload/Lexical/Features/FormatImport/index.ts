import { createServerFeature } from "@payloadcms/richtext-lexical";

/**
 * FormatImportFeature
 *
 * Adds smart paste handling for:
 * - **Markdown** — plain text with markdown syntax is automatically converted
 *   to Lexical nodes (headings, lists, blockquotes, code blocks, bold, italic,
 *   strikethrough, inline code, links).
 * - **Notion HTML** — content copied from Notion is detected and imported via
 *   Lexical's DOM-to-nodes conversion.
 *
 * Usage in your editor config:
 * ```ts
 * import { FormatImportFeature } from "@/payload/Lexical/Features/FormatImport"
 *
 * lexicalEditor({
 *   features: ({ defaultFeatures }) => [
 *     ...defaultFeatures,
 *     FormatImportFeature(),
 *   ]
 * })
 * ```
 */
export const FormatImportFeature = createServerFeature({
  key: "formatImport",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/FormatImport/feature.client.ts#FormatImportClientFeature"
  }
});
