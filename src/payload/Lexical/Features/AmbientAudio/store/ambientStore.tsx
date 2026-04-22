"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createStore, type StoreApi, useStore } from "zustand";

import type { AnchorKind } from "../nodes/types";
import type { SavedCaretPoint } from "../utils/anchors";

/**
 * Coarse legacy mode flag. Kept so existing callers (SelectModeOverlay,
 * ContextMenu, TrackPicker) keep working during the select-mode overhaul.
 * `phase` below is the new source of truth.
 */
export type AmbientMode = "idle" | "selecting" | "placing";

/**
 * Fine-grained phase for the calendar-style range picker. Every transition
 * goes through `setPhase`; exit triggers converge on `finalizePlacement`
 * (utils/anchors.ts) which inspects the current phase.
 */
export type AmbientPhase =
  | "idle"
  | "placingStart"
  | "placingEnd"
  | "pickingTrack"
  | "settled";

export interface ResetWindow {
  x: number;
  y: number;
  /** performance.now() + RESET_WINDOW_MS */
  expiresAt: number;
}

export interface DragState {
  nodeKey: string;
  pointerId: number;
  originX: number;
  originY: number;
  /** Node-key of the slot the pointer is currently hovering. Null until
   *  first move. */
  proposedSlotKey: string | null;
  /** True when the proposed slot would cross the partner anchor. The
   *  AnchorDragReorder component flashes the denial shake when this flips. */
  denied: boolean;
}

export interface AmbientStoreState {
  // ---- Legacy fields (keep for backward compatibility) --------------------
  mode: AmbientMode;
  pendingGroupId: string | null;
  pendingAnchor: AnchorKind | null;
  pickerOpen: boolean;
  pickerAnchorEl: HTMLElement | null;
  pickerGroupId: string | null;

  // ---- Select-mode state machine ------------------------------------------
  phase: AmbientPhase;
  caretNavArmed: boolean;
  focusedNodeKey: string | null;
  /**
   * Full caret snapshot (node + offset + type) captured by CaretNavigator.
   * Used by commitFocused so anchors land exactly where the caret is, not
   * at the block edge.
   */
  pendingCaretPoint: SavedCaretPoint | null;
  /**
   * Live pointer position in viewport coords while placing. Drives the
   * character-level range preview in SelectionFollowOverlay. Null when not
   * placing or the pointer is outside the editor.
   */
  pendingPointerPoint: { x: number; y: number } | null;
  pendingStartKey: string | null;
  pendingEndKey: string | null;
  resetWindow: ResetWindow | null;
  dragState: DragState | null;
  /**
   * Which settled region the pointer is currently hovering over (via its
   * anchor chip). Drives the pronounced tint on `AmbientRegionHighlight`.
   */
  hoveredGroupId: string | null;
  /**
   * Which settled region the context menu is currently targeting. Set by the
   * ambient contributor when its `resolve()` returns a hit, cleared when the
   * menu closes. Drives the pronounced tint so users see which region a
   * ctx-menu command will act on.
   */
  activeCtxGroupId: string | null;

  // ---- Actions ------------------------------------------------------------
  enterSelectMode: () => void;
  exitSelectMode: () => void;
  setPendingAnchor: (kind: AnchorKind | null) => void;
  setPendingGroupId: (gid: string | null) => void;
  openPicker: (args: {
    anchorEl: HTMLElement | null;
    groupId?: string | null;
  }) => void;
  closePicker: () => void;

  setPhase: (phase: AmbientPhase) => void;
  armCaretNav: () => void;
  disarmCaretNav: () => void;
  setFocusedNodeKey: (key: string | null) => void;
  setPendingCaretPoint: (point: SavedCaretPoint | null) => void;
  setPendingPointerPoint: (point: { x: number; y: number } | null) => void;
  setPendingStartKey: (key: string | null) => void;
  setPendingEndKey: (key: string | null) => void;
  openResetWindow: (x: number, y: number, expiresAt: number) => void;
  closeResetWindow: () => void;
  startDrag: (state: DragState) => void;
  updateDrag: (
    patch: Partial<Pick<DragState, "proposedSlotKey" | "denied">>
  ) => void;
  endDrag: () => void;
  setHoveredGroupId: (gid: string | null) => void;
  setActiveCtxGroupId: (gid: string | null) => void;

  reset: () => void;
}

type StateShape = Omit<
  AmbientStoreState,
  | "enterSelectMode"
  | "exitSelectMode"
  | "setPendingAnchor"
  | "setPendingGroupId"
  | "openPicker"
  | "closePicker"
  | "setPhase"
  | "armCaretNav"
  | "disarmCaretNav"
  | "setFocusedNodeKey"
  | "setPendingCaretPoint"
  | "setPendingPointerPoint"
  | "setPendingStartKey"
  | "setPendingEndKey"
  | "openResetWindow"
  | "closeResetWindow"
  | "startDrag"
  | "updateDrag"
  | "endDrag"
  | "setHoveredGroupId"
  | "setActiveCtxGroupId"
  | "reset"
>;

const INITIAL: StateShape = {
  mode: "idle",
  pendingGroupId: null,
  pendingAnchor: null,
  pickerOpen: false,
  pickerAnchorEl: null,
  pickerGroupId: null,
  phase: "idle",
  caretNavArmed: false,
  focusedNodeKey: null,
  pendingCaretPoint: null,
  pendingPointerPoint: null,
  pendingStartKey: null,
  pendingEndKey: null,
  resetWindow: null,
  dragState: null,
  hoveredGroupId: null,
  activeCtxGroupId: null
};

const createAmbientStore = () =>
  createStore<AmbientStoreState>()((set) => ({
    ...INITIAL,

    enterSelectMode: () =>
      set((state) => ({
        ...state,
        mode: "selecting",
        phase: "placingStart",
        caretNavArmed: false,
        focusedNodeKey: null,
        pendingCaretPoint: null,
        pendingPointerPoint: null,
        pendingStartKey: null,
        pendingEndKey: null,
        resetWindow: null,
        dragState: null
      })),
    exitSelectMode: () =>
      set((state) => ({
        ...state,
        mode: "idle",
        phase: "idle",
        caretNavArmed: false,
        focusedNodeKey: null,
        pendingCaretPoint: null,
        pendingPointerPoint: null,
        pendingStartKey: null,
        pendingEndKey: null,
        resetWindow: null,
        dragState: null,
        pendingAnchor: null,
        pendingGroupId: null,
        pickerOpen: false,
        pickerAnchorEl: null,
        pickerGroupId: null
      })),
    setPendingAnchor: (kind) =>
      set((state) => ({ ...state, pendingAnchor: kind })),
    setPendingGroupId: (gid) =>
      set((state) => ({ ...state, pendingGroupId: gid })),
    openPicker: ({ anchorEl, groupId = null }) =>
      set((state) => ({
        ...state,
        pickerOpen: true,
        pickerAnchorEl: anchorEl,
        pickerGroupId: groupId,
        phase:
          state.phase === "placingEnd" || state.phase === "pickingTrack"
            ? "pickingTrack"
            : state.phase
      })),
    closePicker: () =>
      set((state) => ({
        ...state,
        pickerOpen: false,
        pickerAnchorEl: null,
        pickerGroupId: null
      })),

    setPhase: (phase) => set((state) => ({ ...state, phase })),
    armCaretNav: () => set((state) => ({ ...state, caretNavArmed: true })),
    disarmCaretNav: () =>
      set((state) => ({
        ...state,
        caretNavArmed: false,
        focusedNodeKey: null,
        pendingCaretPoint: null
      })),
    setFocusedNodeKey: (key) =>
      set((state) => ({ ...state, focusedNodeKey: key })),
    setPendingCaretPoint: (point) =>
      set((state) => ({ ...state, pendingCaretPoint: point })),
    setPendingPointerPoint: (point) =>
      set((state) => ({ ...state, pendingPointerPoint: point })),
    setPendingStartKey: (key) =>
      set((state) => ({ ...state, pendingStartKey: key })),
    setPendingEndKey: (key) =>
      set((state) => ({ ...state, pendingEndKey: key })),
    openResetWindow: (x, y, expiresAt) =>
      set((state) => ({ ...state, resetWindow: { x, y, expiresAt } })),
    closeResetWindow: () => set((state) => ({ ...state, resetWindow: null })),
    startDrag: (dragState) => set((state) => ({ ...state, dragState })),
    updateDrag: (patch) =>
      set((state) =>
        state.dragState
          ? { ...state, dragState: { ...state.dragState, ...patch } }
          : state
      ),
    endDrag: () => set((state) => ({ ...state, dragState: null })),
    setHoveredGroupId: (gid) =>
      set((state) => ({ ...state, hoveredGroupId: gid })),
    setActiveCtxGroupId: (gid) =>
      set((state) => ({ ...state, activeCtxGroupId: gid })),

    reset: () => set(INITIAL as Partial<AmbientStoreState>)
  }));

type AmbientStoreApi = StoreApi<AmbientStoreState>;

const AmbientStoreContext = createContext<AmbientStoreApi | undefined>(
  undefined
);

export const AmbientAudioProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useRef<AmbientStoreApi>(null!);
  if (!storeRef.current) {
    storeRef.current = createAmbientStore();
  }
  return (
    <AmbientStoreContext.Provider value={storeRef.current}>
      {children}
    </AmbientStoreContext.Provider>
  );
};

export function useAmbientStore<T>(selector: (s: AmbientStoreState) => T): T {
  const store = useContext(AmbientStoreContext);
  if (!store) {
    throw new Error(
      "useAmbientStore must be used within <AmbientAudioProvider>"
    );
  }
  return useStore(store, selector);
}

export function useAmbientStoreApi(): AmbientStoreApi {
  const store = useContext(AmbientStoreContext);
  if (!store) {
    throw new Error(
      "useAmbientStoreApi must be used within <AmbientAudioProvider>"
    );
  }
  return store;
}
