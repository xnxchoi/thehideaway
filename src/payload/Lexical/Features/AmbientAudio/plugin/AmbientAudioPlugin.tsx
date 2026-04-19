"use client";

import type { PluginComponent } from "@payloadcms/richtext-lexical";
import {
  COMMAND_PRIORITY_HIGH,
  KEY_DOWN_COMMAND,
  KEY_ESCAPE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { mergeRegister } from "@payloadcms/richtext-lexical/lexical/utils";
import { useEffect } from "react";

import type { AnchorKind } from "../nodes/types";
import { useAmbientStore, useAmbientStoreApi } from "../store/ambientStore";
import { createGroupId } from "../utils/anchors";
import { AmbientContextMenu } from "./ContextMenu";
import { SelectModeOverlay } from "./SelectModeOverlay";
import { TrackPicker } from "./TrackPicker";

export const AmbientAudioPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const mode = useAmbientStore((s) => s.mode);

  useEffect(() => {
    if (mode !== "selecting") return;

    const placeAnchor = (kind: AnchorKind) => {
      const rootEl = editor.getRootElement();
      const activeEl = document.activeElement;
      if (
        !rootEl ||
        !activeEl ||
        (!rootEl.contains(activeEl) && activeEl !== rootEl)
      ) {
        return false;
      }

      const state = storeApi.getState();
      const groupId = state.pendingGroupId ?? createGroupId();
      if (!state.pendingGroupId) {
        state.setPendingGroupId(groupId);
      }
      state.setPendingAnchor(kind);

      // Stash caret rect as a floating anchor target for the picker.
      const sel = window.getSelection();
      let rect: DOMRect | null = null;
      if (sel && sel.rangeCount > 0) {
        rect = sel.getRangeAt(0).getBoundingClientRect();
      }

      const virtualEl = document.createElement("span");
      virtualEl.style.position = "fixed";
      virtualEl.style.width = "1px";
      virtualEl.style.height = "1em";
      virtualEl.style.pointerEvents = "none";
      virtualEl.style.left = `${rect?.left ?? 16}px`;
      virtualEl.style.top = `${rect?.top ?? 16}px`;
      document.body.appendChild(virtualEl);

      state.openPicker({ anchorEl: virtualEl, groupId: null });

      window.setTimeout(() => {
        if (virtualEl.isConnected) virtualEl.remove();
      }, 30000);

      return true;
    };

    const unregister = mergeRegister(
      editor.registerCommand(
        KEY_DOWN_COMMAND,
        (event) => {
          if (!(event instanceof KeyboardEvent)) return false;
          const isMod = event.metaKey || event.ctrlKey;
          if (!isMod) return false;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            placeAnchor("start");
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            placeAnchor("end");
            return true;
          }
          return false;
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          storeApi.getState().exitSelectMode();
          return true;
        },
        COMMAND_PRIORITY_HIGH
      )
    );

    return unregister;
  }, [editor, mode, storeApi]);

  return (
    <>
      <AmbientContextMenu />
      <SelectModeOverlay />
      <TrackPicker />
    </>
  );
};
