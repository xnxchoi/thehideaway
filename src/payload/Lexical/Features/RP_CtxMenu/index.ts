import { createServerFeature } from "@payloadcms/richtext-lexical";

export type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLeafItem,
  ContextMenuSeparatorItem,
  ContextMenuSubmenuItem,
  EditorContext,
  ImportFilter,
  SelectionKind
} from "./types";
export { useRegisterContextMenuContributor } from "./registry/ContributorRegistry";
export { RPContextMenuHandle } from "./plugin/ContextMenuHandle";
export { useCtxMenuStore } from "./store/ctxMenuStore";

export const RPContextMenuFeature = createServerFeature({
  key: "rpContextMenuFeature",
  feature: {
    ClientFeature:
      "@/payload/Lexical/Features/RP_CtxMenu/feature.client#RPContextMenuClientFeature"
  }
});
