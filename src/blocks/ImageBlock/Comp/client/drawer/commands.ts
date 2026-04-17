import {
  createCommand,
  LexicalCommand
} from "@payloadcms/richtext-lexical/lexical";
import { RPImageDataAgnostic } from "../../server/node/RP_ImageNode";

export type RPImagePayload = Readonly<RPImageDataAgnostic>;
export const INSERT_RP_IMAGE_WITH_TAB_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false;
  payload: RPImagePayload;
}> = createCommand("INSERT_RP_IMAGE_WITH_TAB_COMMAND");
export const INSERT_RP_IMAGE_COMMAND: LexicalCommand<RPImagePayload> =
  createCommand("INSERT_RP_IMAGE_COMMAND");
export const INSERT_RP_PLACEHOLDER_COMMAND: LexicalCommand<{
  replace: { nodeKey: string } | false;
}> = createCommand("INSERT_RP_PLACEHOLDER_COMMAND");
