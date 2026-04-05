import { createCommand, type LexicalCommand } from "@payloadcms/richtext-lexical/lexical";
import type { LinkPreviewDisplayMode } from "../nodes/LinkPreviewNode";

export const INSERT_LINK_PREVIEW_COMMAND: LexicalCommand<{
  url?: string;
  displayMode?: LinkPreviewDisplayMode;
}> = createCommand("INSERT_LINK_PREVIEW_COMMAND");
