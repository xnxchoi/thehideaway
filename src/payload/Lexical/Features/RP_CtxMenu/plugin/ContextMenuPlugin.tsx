"use client";

import { ContextMenu } from "@base-ui/react";
import { useEditorConfigContext } from "@payloadcms/richtext-lexical/client";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import type { PluginComponent } from "@payloadcms/richtext-lexical";
import { useCallback, useEffect, useMemo } from "react";

import { useContextMenuRegistry } from "../registry/ContributorRegistry";
import { useCtxMenuStore, useCtxMenuStoreApi } from "../store/ctxMenuStore";
import { MenuPopup } from "../ui/MenuPrimitives";
import { MenuRenderer } from "../ui/MenuRenderer";
import { composeMenuGroups } from "../utils/merge";
import { resolveEditorContext } from "../utils/resolveEditorContext";
import { RPContextMenuHandle } from "./ContextMenuHandle";

/**
 * Virtual anchor for positioning the Base UI ContextMenu Popup at an exact
 * viewport coordinate.
 */
function makeVirtualAnchor(x: number, y: number) {
  const rect = {
    x,
    y,
    top: y,
    left: x,
    right: x,
    bottom: y,
    width: 0,
    height: 0,
    toJSON() {
      return this;
    }
  };
  return { getBoundingClientRect: () => rect as DOMRect };
}

export const ContextMenuPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const editorConfigContext = useEditorConfigContext();
  const storeApi = useCtxMenuStoreApi();
  const { getContributors, version } = useContextMenuRegistry();

  const open = useCtxMenuStore((s) => s.open);
  const x = useCtxMenuStore((s) => s.x);
  const y = useCtxMenuStore((s) => s.y);
  const context = useCtxMenuStore((s) => s.context);

  // ---- Right-click capture at the editor root ---------------------------
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;

    const onContextMenu = (event: MouseEvent) => {
      // Allow anything that explicitly opts out (e.g. Payload's own admin
      // UI inside an inline block).
      const domTarget =
        event.target instanceof HTMLElement ? event.target : null;
      if (domTarget?.closest("[data-rp-ctxmenu-ignore]")) return;

      event.preventDefault();
      event.stopPropagation();

      const ctx = resolveEditorContext({
        editor,
        editorConfigContext,
        x: event.clientX,
        y: event.clientY,
        domTarget
      });

      // Offset the popover slightly from the cursor so the first item
      // doesn't land directly under the pointer (prevents accidental clicks
      // on release or double-fire from the context-menu gesture).
      storeApi.getState().openMenu({
        x: event.clientX + 12,
        y: event.clientY + 4,
        context: ctx
      });
    };

    root.addEventListener("contextmenu", onContextMenu);
    return () => {
      root.removeEventListener("contextmenu", onContextMenu);
    };
  }, [editor, editorConfigContext, storeApi]);

  // ---- Compose groups from contributors ---------------------------------
  const groups = useMemo(() => {
    if (!open || !context) return [];
    const contributors = getContributors();
    return composeMenuGroups(contributors, context);
    // `version` is read so contributor (re)registration re-runs the compose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, context, getContributors, version]);

  const virtualAnchor = useMemo(() => makeVirtualAnchor(x, y), [x, y]);

  const onOpenChange = useCallback(
    (next: boolean) => {
      if (!next) storeApi.getState().closeMenu();
    },
    [storeApi]
  );

  const onItemSelected = useCallback(() => {
    storeApi.getState().closeMenu();
  }, [storeApi]);

  // Don't render the portal tree when the menu has no content to show.
  if (!context || groups.length === 0) {
    return (
      <ContextMenu.Root
        handle={RPContextMenuHandle}
        open={false}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <ContextMenu.Root
      handle={RPContextMenuHandle}
      open={open}
      onOpenChange={onOpenChange}
    >
      <ContextMenu.Portal>
        <ContextMenu.Positioner
          anchor={virtualAnchor}
          side="bottom"
          align="start"
          sideOffset={4}
          className="outline-none"
        >
          <MenuPopup>
            <MenuRenderer
              groups={groups}
              context={context}
              onItemSelected={onItemSelected}
            />
          </MenuPopup>
        </ContextMenu.Positioner>
      </ContextMenu.Portal>
    </ContextMenu.Root>
  );
};
