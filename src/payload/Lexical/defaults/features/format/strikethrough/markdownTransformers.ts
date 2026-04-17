import { TextFormatTransformer } from "@payloadcms/richtext-lexical/lexical/markdown";

export const STRIKETHROUGH: TextFormatTransformer = {
  type: "text-format",
  format: ["strikethrough"],
  tag: "~~"
};
