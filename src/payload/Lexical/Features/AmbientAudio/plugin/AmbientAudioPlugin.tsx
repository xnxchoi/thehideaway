"use client";

import type { PluginComponent } from "@payloadcms/richtext-lexical";
import {
  $getNodeByKey,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef } from "react";

import {
  type AmbientAudioEndNode
} from "../nodes/AmbientAudioEndNode";
import {
  type AmbientAudioStartNode
} from "../nodes/AmbientAudioStartNode";
import {
  useAmbientStore,
  useAmbientStoreApi,
  type AmbientPhase
} from "../store/ambientStore";
import {
  $findAnchorPair,
  $findBlockAncestor,
  $finalizePlacement,
  $groupRangeIndices,
  $insertAnchorAtBlockEnd,
  $insertAnchorAtBlockStart,
  $removeGroup,
  $validateProposedRange,
  createGroupId,
  PLACEHOLDER_TRACK
} from "../utils/anchors";
import { AnchorContextMenu } from "./AnchorContextMenu";
import { AnchorDragReorder } from "./AnchorDragReorder";
import { CaretNavigator } from "./CaretNavigator";
import { CommitChip } from "./CommitChip";
import { AmbientContextMenu } from "./ContextMenu";
import { ResetPrompt } from "./ResetPrompt";
import { SelectModeOverlay } from "./SelectModeOverlay";
import { TrackPicker } from "./TrackPicker";

const OPT_ARROW_COMMIT_DEBOUNCE_MS = 180;
const RESET_WINDOW_MS = 1400;
const RESET_WINDOW_RADIUS_PX = 96;

type ExitReason =
  | "esc"
  | "enter"
  | "typed"
  | "blur"
  | "route-change"
  | "reinvoke"
  | "manual";

function isPrintableKey(e: KeyboardEvent): boolean {
  if (e.key === "Backspace" || e.key === "Delete") return true;
  if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) return true;
  return false;
}

function isArrowKey(e: KeyboardEvent): boolean {
  return (
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight"
  );
}

export const AmbientAudioPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const phase = useAmbientStore((s) => s.phase);
  const pickerOpen = useAmbientStore((s) => s.pickerOpen);

  // --- Shared commit path -------------------------------------------------
  const commitFocused = useCallback(() => {
    const s = storeApi.getState();
    const focusedKey = s.focusedNodeKey;
    if (!focusedKey) return;

    const ph = s.phase;
    if (ph !== "placingStart" && ph !== "placingEnd") return;

    editor.update(() => {
      const node = $getNodeByKey(focusedKey);
      if (!node) return;
      const block = $findBlockAncestor(node);
      if (!block) return;

      const groupId = s.pendingGroupId ?? createGroupId();

      if (ph === "placingStart") {
        const startKey = $insertAnchorAtBlockStart(
          block,
          "start",
          groupId,
          PLACEHOLDER_TRACK
        );
        if (!startKey) return;
        storeApi.getState().setPendingStartKey(startKey);
        storeApi.getState().setPendingGroupId(groupId);
        storeApi.getState().setPhase("placingEnd");
      } else {
        const endKey = $insertAnchorAtBlockEnd(
          block,
          "end",
          groupId,
          PLACEHOLDER_TRACK
        );
        if (!endKey) return;
        storeApi.getState().setPendingEndKey(endKey);
        storeApi.getState().setPhase("pickingTrack");
        const el = editor.getElementByKey(endKey);
        storeApi.getState().openPicker({ anchorEl: el, groupId });
      }
    });

    // Overlap guard (post-commit rollback).
    editor.update(() => {
      const st = storeApi.getState();
      if (!st.pendingStartKey) return;
      const startNode = $getNodeByKey(
        st.pendingStartKey
      ) as AmbientAudioStartNode | null;
      const endNode = st.pendingEndKey
        ? ($getNodeByKey(st.pendingEndKey) as AmbientAudioEndNode | null)
        : null;
      const range = $groupRangeIndices(startNode, endNode);
      if (!range) return;
      const v = $validateProposedRange({
        startIdx: range.startIdx,
        endIdx: range.endIdx,
        excludeGroupId: st.pendingGroupId ?? undefined
      });
      if (!v.ok) {
        if (endNode) endNode.remove();
        else if (startNode) startNode.remove();
        if (st.phase === "pickingTrack") {
          st.setPendingEndKey(null);
          st.setPhase("placingEnd");
          st.closePicker();
        } else if (st.phase === "placingEnd") {
          st.setPendingStartKey(null);
          st.setPendingGroupId(null);
          st.setPhase("placingStart");
        }
      }
    });
  }, [editor, storeApi]);

  // --- Finalize (never destructive) ---------------------------------------
  const finalize = useCallback(
    (_reason: ExitReason) => {
      const s = storeApi.getState();
      if (s.phase === "idle") return;

      if (s.phase === "settled") {
        storeApi.getState().exitSelectMode();
        return;
      }

      editor.update(() => {
        const result = $finalizePlacement({
          editor,
          pendingStartKey: s.pendingStartKey,
          pendingEndKey: s.pendingEndKey,
          pendingGroupId: s.pendingGroupId,
          track: PLACEHOLDER_TRACK
        });
        void result;
      });

      storeApi.getState().exitSelectMode();
    },
    [editor, storeApi]
  );

  // --- Picker close handling ---------------------------------------------
  useEffect(() => {
    if (phase !== "pickingTrack") return;
    if (!pickerOpen) {
      storeApi.getState().setPhase("settled");
    }
  }, [phase, pickerOpen, storeApi]);

  // --- Keydown driver -----------------------------------------------------
  const optArrowTimer = useRef<number | null>(null);
  useEffect(() => {
    const unregister = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event) => {
        if (!(event instanceof KeyboardEvent)) return false;
        const e = event;
        const st = storeApi.getState();
        const ph = st.phase;

        if (ph === "idle") return false;

        if (e.key === "Escape") {
          e.preventDefault();
          finalize("esc");
          return true;
        }

        if (e.key === "Enter" && !e.shiftKey) {
          if (ph === "placingStart" || ph === "placingEnd") {
            e.preventDefault();
            commitFocused();
            return true;
          }
          if (ph === "settled" || ph === "pickingTrack") {
            e.preventDefault();
            finalize("enter");
            return true;
          }
        }

        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          if (ph === "placingStart" || ph === "placingEnd") {
            e.preventDefault();
            commitFocused();
            return true;
          }
        }

        if (isArrowKey(e)) {
          if (!st.caretNavArmed) st.armCaretNav();
          if (e.altKey && (ph === "placingStart" || ph === "placingEnd")) {
            if (optArrowTimer.current) {
              window.clearTimeout(optArrowTimer.current);
            }
            optArrowTimer.current = window.setTimeout(() => {
              optArrowTimer.current = null;
              commitFocused();
            }, OPT_ARROW_COMMIT_DEBOUNCE_MS);
          }
          return false;
        }

        // Printable / backspace / delete while select-mode is active →
        // finalize and let the keystroke flow through.
        if (
          (ph === "placingStart" ||
            ph === "placingEnd" ||
            ph === "pickingTrack" ||
            ph === "settled") &&
          isPrintableKey(e) &&
          !e.metaKey &&
          !e.ctrlKey &&
          !e.altKey
        ) {
          finalize("typed");
          return false;
        }

        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
    return () => {
      unregister();
      if (optArrowTimer.current) {
        window.clearTimeout(optArrowTimer.current);
        optArrowTimer.current = null;
      }
    };
  }, [editor, storeApi, finalize, commitFocused]);

  // --- Pointer routing (anchor click + in-range reset) -------------------
  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const findAnchorElFromEvent = (
      target: EventTarget | null
    ): HTMLElement | null => {
      if (!(target instanceof HTMLElement)) return null;
      return target.closest<HTMLElement>("[data-ambient-anchor]");
    };

    const pointInRange = (x: number, y: number): boolean => {
      const st = storeApi.getState();
      if (st.phase !== "settled") return false;
      void x;
      let inRange = false;
      editor.getEditorState().read(() => {
        const pair = st.pendingGroupId
          ? $findAnchorPair(st.pendingGroupId)
          : null;
        if (!pair || !pair.start || !pair.end) return;
        const startEl = editor.getElementByKey(pair.start.getKey());
        const endEl = editor.getElementByKey(pair.end.getKey());
        if (!startEl || !endEl) return;
        const sr = startEl.getBoundingClientRect();
        const er = endEl.getBoundingClientRect();
        if (y >= sr.top && y <= er.bottom) inRange = true;
      });
      return inRange;
    };

    const onPointerDown = (e: PointerEvent) => {
      const st = storeApi.getState();

      const anchorEl = findAnchorElFromEvent(e.target);
      if (anchorEl) {
        const groupId = anchorEl.getAttribute("data-ambient-group");
        const kind = anchorEl.getAttribute("data-ambient-anchor");
        if (!groupId || !kind) return;
        editor.getEditorState().read(() => {
          const pair = $findAnchorPair(groupId);
          const target = kind === "start" ? pair.start : pair.end;
          if (target) {
            storeApi.getState().openAnchorMenu(target.getKey(), anchorEl);
          }
        });
        return;
      }

      if (st.phase === "settled" && pointInRange(e.clientX, e.clientY)) {
        const now = performance.now();
        const existing = st.resetWindow;
        if (existing && now < existing.expiresAt) {
          const dx = e.clientX - existing.x;
          const dy = e.clientY - existing.y;
          if (Math.hypot(dx, dy) <= RESET_WINDOW_RADIUS_PX) {
            editor.update(() => {
              if (st.pendingGroupId) $removeGroup(st.pendingGroupId);
            });
            storeApi.getState().closeResetWindow();
            storeApi.getState().setPendingStartKey(null);
            storeApi.getState().setPendingEndKey(null);
            storeApi.getState().setPendingGroupId(null);
            storeApi.getState().setPhase("placingStart");
            return;
          }
        }
        storeApi
          .getState()
          .openResetWindow(e.clientX, e.clientY, now + RESET_WINDOW_MS);
      }
    };

    rootEl.addEventListener("pointerdown", onPointerDown);
    return () => {
      rootEl.removeEventListener("pointerdown", onPointerDown);
    };
  }, [editor, storeApi]);

  // --- Document-level click → finalize on outside-click ------------------
  useEffect(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl) return;

    const onDocPointerDown = (e: PointerEvent) => {
      const st = storeApi.getState();
      if (st.phase === "idle") return;
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (rootEl.contains(target)) return;
      const isOurPortal =
        !!target.closest("[data-ambient-portal]") ||
        !!target.closest("[data-ambient-anchor]") ||
        !!target.closest("[role='menu']") ||
        !!target.closest("[cmdk-input]") ||
        !!target.closest("[cmdk-list]");
      if (isOurPortal) return;
      finalize("blur");
    };

    document.addEventListener("pointerdown", onDocPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown, true);
    };
  }, [editor, storeApi, finalize]);

  // --- Page hide / route change -----------------------------------------
  useEffect(() => {
    const onPageHide = () => {
      if (storeApi.getState().phase !== "idle") finalize("route-change");
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [storeApi, finalize]);

  // --- Anchor-context-menu callbacks ------------------------------------
  const onOpenPickerForGroup = useCallback(
    (args: { anchorEl: HTMLElement | null; groupId: string }) => {
      storeApi.getState().openPicker({
        anchorEl: args.anchorEl,
        groupId: args.groupId
      });
      storeApi.getState().setPhase("pickingTrack");
    },
    [storeApi]
  );

  const onAdjustRange = useCallback(
    (groupId: string) => {
      editor.update(() => {
        const pair = $findAnchorPair(groupId);
        if (pair.start) pair.start.remove();
        if (pair.end) pair.end.remove();
      });
      storeApi.getState().setPendingStartKey(null);
      storeApi.getState().setPendingEndKey(null);
      storeApi.getState().setPendingGroupId(groupId);
      storeApi.getState().setPhase("placingStart");
    },
    [editor, storeApi]
  );

  return (
    <>
      <AmbientContextMenu />
      <SelectModeOverlay />
      <CaretNavigator />
      <CommitChip onCommit={commitFocused} />
      <ResetPrompt />
      <AnchorContextMenu
        onOpenPickerForGroup={onOpenPickerForGroup}
        onAdjustRange={onAdjustRange}
      />
      <AnchorDragReorder />
      <TrackPicker />
    </>
  );
};

export type { AmbientPhase };
