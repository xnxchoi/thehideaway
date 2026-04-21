"use client";

import type { PluginComponent } from "@payloadcms/richtext-lexical";
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $isTextNode,
  COMMAND_PRIORITY_CRITICAL,
  KEY_DOWN_COMMAND,
  SKIP_SCROLL_INTO_VIEW_TAG,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useCallback, useEffect, useRef } from "react";

import "../ambient.scss";

import {
  useAmbientStore,
  useAmbientStoreApi,
  type AmbientPhase
} from "../store/ambientStore";
import {
  $createAmbientAnchor,
  $findAnchorPair,
  $findBlockAncestor,
  $findPlaceableBlockForEmptyExit,
  $finalizePlacement,
  $insertAnchorAtBlockEnd,
  $insertAnchorAtBlockStart,
  $insertAnchorAtSelection,
  $isAmbientEndAnchor,
  $isAmbientStartAnchor,
  $listGroups,
  $removeGroup,
  createGroupId,
  getAnchorRegion,
  PLACEHOLDER_REGION,
  type SavedCaretPoint
} from "../utils/anchors";
import { $resolveCandidateOverlaps } from "../utils/overlap";
import { toast } from "sonner";
import { AnchorDragReorder } from "./AnchorDragReorder";
import { CaretNavigator } from "./CaretNavigator";
import { CommitChip } from "./CommitChip";
import { AmbientContextMenu } from "./ContextMenu";
import { ResetPrompt } from "./ResetPrompt";
import { SelectionFollowOverlay } from "./SelectionFollowOverlay";
import { SelectModeOverlay } from "./SelectModeOverlay";
import { TrackPicker } from "./TrackPicker";
import { Menu } from "@base-ui/react";

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

/**
 * Resolve a viewport (x, y) click into a Lexical SavedCaretPoint. Uses the
 * native caret-from-point APIs, then maps the DOM hit onto its owning
 * Lexical node. Returning a fresh snapshot from the exact click location
 * avoids reading `pendingCaretPoint`, which is populated asynchronously via
 * SELECTION_CHANGE_COMMAND and therefore stale at click-handler time.
 */
function resolvePointToCaret(
  editor: LexicalEditor,
  x: number,
  y: number
): SavedCaretPoint | null {
  type DocumentWithCaret = Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number
    ) => { offsetNode: Node; offset: number } | null;
  };
  const doc = document as DocumentWithCaret;
  let domNode: Node | null = null;
  let offset = 0;

  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y);
    if (pos && pos.offsetNode) {
      domNode = pos.offsetNode;
      offset = pos.offset;
    }
  }
  if (!domNode && typeof doc.caretRangeFromPoint === "function") {
    const range = doc.caretRangeFromPoint(x, y);
    if (range) {
      domNode = range.startContainer;
      offset = range.startOffset;
    }
  }
  if (!domNode) return null;

  const targetDomNode = domNode;
  const targetOffset = offset;
  let result: SavedCaretPoint | null = null;
  editor.read(() => {
    const lexicalNode = $getNearestNodeFromDOMNode(targetDomNode);
    if (!lexicalNode) return;
    if ($isTextNode(lexicalNode)) {
      result = {
        nodeKey: lexicalNode.getKey(),
        offset: targetOffset,
        type: "text"
      };
    } else {
      // DOM hit an element (whitespace between inlines, block boundary, etc).
      // Use an element-anchored point at the best-effort offset. Lexical will
      // clamp out-of-range offsets on insertion.
      result = {
        nodeKey: lexicalNode.getKey(),
        offset: targetOffset,
        type: "element"
      };
    }
  });
  return result;
}
export const AmbienceHandle = Menu.createHandle();
export const AmbientAudioPlugin: PluginComponent = () => {
  const [editor] = useLexicalComposerContext();
  const storeApi = useAmbientStoreApi();
  const phase = useAmbientStore((s) => s.phase);
  const pickerOpen = useAmbientStore((s) => s.pickerOpen);

  // --- Shared commit path -------------------------------------------------
  const commitFocused = useCallback(
    (explicitPoint?: SavedCaretPoint | null) => {
    const s = storeApi.getState();
    const focusedKey = s.focusedNodeKey;
    if (!focusedKey) return;

    const ph = s.phase;
    if (ph !== "placingStart" && ph !== "placingEnd") return;

    // Prefer an explicit point supplied by the caller (e.g., resolved from
    // the click coordinates synchronously). `pendingCaretPoint` is populated
    // by CaretNavigator via SELECTION_CHANGE_COMMAND, which is batched and
    // therefore stale at click-handler time — relying on it caused the
    // end anchor to land at the previously-committed position when the user
    // clicked somewhere new.
    const savedPoint = explicitPoint ?? s.pendingCaretPoint;

    editor.update(() => {
      const node = $getNodeByKey(focusedKey);
      if (!node) return;
      const block = $findBlockAncestor(node);
      if (!block) return;

      const groupId = s.pendingGroupId ?? createGroupId();
      const kind = ph === "placingStart" ? "start" : "end";

      // Prefer caret-precise insertion; fall back to block edges only when
      // the CaretNavigator has not yet recorded a point (should be rare).
      const insertedKey = savedPoint
        ? $insertAnchorAtSelection(
            kind,
            groupId,
            PLACEHOLDER_REGION,
            savedPoint
          )
        : ph === "placingStart"
          ? $insertAnchorAtBlockStart(
              block,
              "start",
              groupId,
              PLACEHOLDER_REGION
            )
          : $insertAnchorAtBlockEnd(block, "end", groupId, PLACEHOLDER_REGION);

      if (!insertedKey) return;

      if (ph === "placingStart") {
        storeApi.getState().setPendingStartKey(insertedKey);
        storeApi.getState().setPendingGroupId(groupId);
        storeApi.getState().setPhase("placingEnd");
      } else {
        // placingEnd: end is inserted; if it landed BEFORE the start in doc
        // order, swap the two node types in-place so the earlier anchor is
        // always "start". Calendar-picker style.
        let startKey = storeApi.getState().pendingStartKey;
        let endKey: string | null = insertedKey;
        const startCandidate = startKey ? $getNodeByKey(startKey) : null;
        const endCandidate = $getNodeByKey(insertedKey);
        const startNode = $isAmbientStartAnchor(startCandidate)
          ? startCandidate
          : null;
        const endNode = $isAmbientEndAnchor(endCandidate)
          ? endCandidate
          : null;
        if (startNode && endNode && endNode.isBefore(startNode)) {
          const region = getAnchorRegion(startNode);
          const newStart = $createAmbientAnchor("start", groupId, region);
          const newEnd = $createAmbientAnchor("end", groupId, region);
          endNode.replace(newStart);
          startNode.replace(newEnd);
          startKey = newStart.getKey();
          endKey = newEnd.getKey();
        }
        storeApi.getState().setPendingStartKey(startKey);
        storeApi.getState().setPendingEndKey(endKey);
        storeApi.getState().setPhase("pickingTrack");
        const el = endKey ? editor.getElementByKey(endKey) : null;
        storeApi.getState().openPicker({ anchorEl: el, groupId });
      }
    }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });

    // Overlap resolution — accept, trim, or remove neighboring groups so the
    // candidate finds a home. If the candidate itself was removed (e.g., it
    // was encased by a media-filled existing region), revert placement state.
    editor.update(() => {
      const st = storeApi.getState();
      const candidateGroupId = st.pendingGroupId;
      if (!candidateGroupId) return;
      // Only meaningful once both anchors exist. The resolver needs a span.
      if (!st.pendingEndKey) return;

      const { candidateSurvived } = $resolveCandidateOverlaps(
        editor,
        candidateGroupId
      );

      if (!candidateSurvived) {
        if (st.phase === "pickingTrack") {
          st.setPendingEndKey(null);
          st.setPendingStartKey(null);
          st.setPendingGroupId(null);
          st.setPhase("placingStart");
          st.closePicker();
        } else if (st.phase === "placingEnd") {
          st.setPendingStartKey(null);
          st.setPendingGroupId(null);
          st.setPhase("placingStart");
        }
        return;
      }

      // Resolution may have moved one or both candidate anchors (remove +
      // reinsert). Refresh the pending keys from the live pair so downstream
      // code references current nodes.
      const pair = $findAnchorPair(candidateGroupId);
      st.setPendingStartKey(pair.start ? pair.start.getKey() : null);
      st.setPendingEndKey(pair.end ? pair.end.getKey() : null);
    }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
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

      const hasCommits = Boolean(s.pendingStartKey || s.pendingEndKey);
      if (hasCommits) {
        editor.update(() => {
          const result = $finalizePlacement({
            editor,
            pendingStartKey: s.pendingStartKey,
            pendingEndKey: s.pendingEndKey,
            pendingGroupId: s.pendingGroupId,
            region: PLACEHOLDER_REGION
          });
          void result;
        }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
      } else {
        // Empty exit. Attempt a viewport-center placeholder, but only if we
        // can find a block that doesn't overlap an existing ambient region.
        // If every candidate overlaps, warn and drop rather than spawn a
        // ghost region that encases an existing one.
        let placed = false;
        let noSlot = false;
        editor.update(() => {
          const block = $findPlaceableBlockForEmptyExit(editor);
          if (!block) {
            noSlot = true;
            return;
          }
          const groupId = createGroupId();
          const startKey = $insertAnchorAtBlockStart(
            block,
            "start",
            groupId,
            PLACEHOLDER_REGION
          );
          const latestBlock = block.getLatest();
          const endKey = $insertAnchorAtBlockEnd(
            latestBlock,
            "end",
            groupId,
            PLACEHOLDER_REGION
          );
          if (startKey && endKey) placed = true;
        }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
        if (!placed && noSlot) {
          toast.warning("Ambient audio dropped — no room for a new region", {
            description: "Existing regions cover the available blocks."
          });
        }
      }

      storeApi.getState().exitSelectMode();
    },
    [editor, storeApi]
  );

  // Stable ref so pointer listeners can call the latest commitFocused without
  // forcing the rootEl effect to re-register on every render.
  const commitFocusedRef = useRef(commitFocused);
  useEffect(() => {
    commitFocusedRef.current = commitFocused;
  }, [commitFocused]);

  // Arrow-key commands route through Lexical's KEY_DOWN_COMMAND which only
  // fires when the contenteditable owns focus. On entering a placement phase
  // (e.g., from a toolbar button or popover), ensure the editor is focused
  // so keyboard nav still works.
  useEffect(() => {
    if (phase === "placingStart" || phase === "placingEnd") {
      editor.focus();
    }
  }, [editor, phase]);

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
          if (st.pickerOpen) {
            st.closePicker();
            if (ph === "pickingTrack") st.setPhase("placingEnd");
            return true;
          }
          if (st.caretNavArmed) {
            st.disarmCaretNav();
            return true;
          }
          if (ph === "placingEnd" && st.pendingStartKey) {
            const startKey = st.pendingStartKey;
            editor.update(() => {
              const n = $getNodeByKey(startKey);
              if (n) n.remove();
            }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
            st.setPendingStartKey(null);
            st.setPendingGroupId(null);
            st.setPhase("placingStart");
            return true;
          }
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
          (ph === "placingStart" || ph === "placingEnd" || ph === "settled") &&
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

    const pointInRange = (_x: number, y: number): boolean => {
      const st = storeApi.getState();
      if (st.phase !== "settled") return false;
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

      if (st.phase === "settled" && pointInRange(e.clientX, e.clientY)) {
        const now = performance.now();
        const existing = st.resetWindow;
        if (existing && now < existing.expiresAt) {
          const dx = e.clientX - existing.x;
          const dy = e.clientY - existing.y;
          if (Math.hypot(dx, dy) <= RESET_WINDOW_RADIUS_PX) {
            editor.update(() => {
              if (st.pendingGroupId) $removeGroup(st.pendingGroupId);
            }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
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

    // Calendar-click placement: first click places start, second click places
    // end. We resolve the caret synchronously from click coordinates and pass
    // it to commitFocused — `pendingCaretPoint` is updated asynchronously via
    // SELECTION_CHANGE_COMMAND and is therefore stale when the click fires.
    const onClick = (e: MouseEvent) => {
      const st = storeApi.getState();
      if (st.phase !== "placingStart" && st.phase !== "placingEnd") return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("[data-ambient-anchor]")) return;
      if (target?.closest("[data-ambient-portal]")) return;
      const point = resolvePointToCaret(editor, e.clientX, e.clientY);
      commitFocusedRef.current(point);
    };

    // Live preview: as the pointer moves over blocks, update focusedNodeKey
    // so SelectionFollowOverlay paints the tentative range up to the cursor.
    // rAF-throttled to avoid thrashing.
    let moveRaf: number | null = null;
    let lastX = 0;
    let lastY = 0;
    const onPointerMove = (e: PointerEvent) => {
      const st = storeApi.getState();
      if (st.phase !== "placingStart" && st.phase !== "placingEnd") return;
      lastX = e.clientX;
      lastY = e.clientY;
      if (moveRaf !== null) return;
      moveRaf = window.requestAnimationFrame(() => {
        moveRaf = null;
        const s = storeApi.getState();
        s.setPendingPointerPoint({ x: lastX, y: lastY });
        let foundKey: string | null = null;
        editor.getEditorState().read(() => {
          const root = $getRoot();
          for (const child of root.getChildren()) {
            const el = editor.getElementByKey(child.getKey());
            if (!el) continue;
            const r = el.getBoundingClientRect();
            if (lastY >= r.top && lastY <= r.bottom) {
              foundKey = child.getKey();
              break;
            }
          }
        });
        if (foundKey && s.focusedNodeKey !== foundKey) {
          s.setFocusedNodeKey(foundKey);
        }
      });
    };

    const onPointerLeave = () => {
      const st = storeApi.getState();
      if (st.phase !== "placingStart" && st.phase !== "placingEnd") return;
      st.setPendingPointerPoint(null);
    };

    const onContextMenu = (ev: Event) => {
      const me = ev as MouseEvent;
      me.preventDefault();

      const anchorEl = findAnchorElFromEvent(me.target);
      if (anchorEl) {
        const groupId = anchorEl.getAttribute("data-ambient-group");
        const kind = anchorEl.getAttribute("data-ambient-anchor");
        let nodeKey: string | null = null;
        if (groupId) {
          editor.getEditorState().read(() => {
            const pair = $findAnchorPair(groupId);
            const target = kind === "start" ? pair.start : pair.end;
            if (target) nodeKey = target.getKey();
          });
        }
        storeApi.getState().openContextMenu(me.clientX, me.clientY, {
          groupId,
          anchorEl,
          nodeKey
        });
        return;
      }

      let hitGroupId: string | null = null;
      let hitAnchorEl: HTMLElement | null = null;
      editor.getEditorState().read(() => {
        for (const pair of $listGroups()) {
          if (!pair.start || !pair.end) continue;
          const startEl = editor.getElementByKey(pair.start.getKey());
          const endEl = editor.getElementByKey(pair.end.getKey());
          if (!startEl || !endEl) continue;
          const sr = startEl.getBoundingClientRect();
          const er = endEl.getBoundingClientRect();
          if (me.clientY >= sr.top && me.clientY <= er.bottom) {
            hitGroupId = pair.groupId;
            hitAnchorEl = startEl;
            break;
          }
        }
      });

      storeApi.getState().openContextMenu(me.clientX, me.clientY, {
        groupId: hitGroupId,
        anchorEl: hitAnchorEl,
        nodeKey: null
      });
    };

    rootEl.addEventListener("pointerdown", onPointerDown);
    rootEl.addEventListener("contextmenu", onContextMenu);
    rootEl.addEventListener("click", onClick);
    rootEl.addEventListener("pointermove", onPointerMove);
    rootEl.addEventListener("pointerleave", onPointerLeave);
    return () => {
      rootEl.removeEventListener("pointerdown", onPointerDown);
      rootEl.removeEventListener("contextmenu", onContextMenu);
      rootEl.removeEventListener("click", onClick);
      rootEl.removeEventListener("pointermove", onPointerMove);
      rootEl.removeEventListener("pointerleave", onPointerLeave);
      if (moveRaf !== null) window.cancelAnimationFrame(moveRaf);
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
      }, { tag: SKIP_SCROLL_INTO_VIEW_TAG });
      storeApi.getState().setPendingStartKey(null);
      storeApi.getState().setPendingEndKey(null);
      storeApi.getState().setPendingGroupId(groupId);
      storeApi.getState().setPhase("placingStart");
    },
    [editor, storeApi]
  );

  return (
    <>
      <AmbientContextMenu
        onOpenPickerForGroup={onOpenPickerForGroup}
        onAdjustRange={onAdjustRange}
      />
      <SelectModeOverlay />
      <SelectionFollowOverlay />
      <CaretNavigator />
      <CommitChip onCommit={commitFocused} />
      <ResetPrompt />
      <AnchorDragReorder />
      <TrackPicker />
    </>
  );
};

export type { AmbientPhase };
