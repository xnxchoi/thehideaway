"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createStore, type StoreApi, useStore } from "zustand";

import type { AnchorKind } from "../nodes/types";

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
  contextMenuOpen: boolean;
  contextMenuX: number;
  contextMenuY: number;

  // ---- Select-mode state machine ------------------------------------------
  phase: AmbientPhase;
  caretNavArmed: boolean;
  focusedNodeKey: string | null;
  pendingStartKey: string | null;
  pendingEndKey: string | null;
  resetWindow: ResetWindow | null;
  dragState: DragState | null;
  anchorMenuKey: string | null;
  anchorMenuEl: HTMLElement | null;

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
  openContextMenu: (x: number, y: number) => void;
  closeContextMenu: () => void;

  setPhase: (phase: AmbientPhase) => void;
  armCaretNav: () => void;
  setFocusedNodeKey: (key: string | null) => void;
  setPendingStartKey: (key: string | null) => void;
  setPendingEndKey: (key: string | null) => void;
  openResetWindow: (x: number, y: number, expiresAt: number) => void;
  closeResetWindow: () => void;
  startDrag: (state: DragState) => void;
  updateDrag: (
    patch: Partial<Pick<DragState, "proposedSlotKey" | "denied">>
  ) => void;
  endDrag: () => void;
  openAnchorMenu: (nodeKey: string, anchorEl: HTMLElement | null) => void;
  closeAnchorMenu: () => void;

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
  | "openContextMenu"
  | "closeContextMenu"
  | "setPhase"
  | "armCaretNav"
  | "setFocusedNodeKey"
  | "setPendingStartKey"
  | "setPendingEndKey"
  | "openResetWindow"
  | "closeResetWindow"
  | "startDrag"
  | "updateDrag"
  | "endDrag"
  | "openAnchorMenu"
  | "closeAnchorMenu"
  | "reset"
>;

const INITIAL: StateShape = {
  mode: "idle",
  pendingGroupId: null,
  pendingAnchor: null,
  pickerOpen: false,
  pickerAnchorEl: null,
  pickerGroupId: null,
  contextMenuOpen: false,
  contextMenuX: 0,
  contextMenuY: 0,
  phase: "idle",
  caretNavArmed: false,
  focusedNodeKey: null,
  pendingStartKey: null,
  pendingEndKey: null,
  resetWindow: null,
  dragState: null,
  anchorMenuKey: null,
  anchorMenuEl: null
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
        pendingStartKey: null,
        pendingEndKey: null,
        resetWindow: null,
        dragState: null,
        contextMenuOpen: false
      })),
    exitSelectMode: () =>
      set((state) => ({
        ...state,
        mode: "idle",
        phase: "idle",
        caretNavArmed: false,
        focusedNodeKey: null,
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
    openContextMenu: (x, y) =>
      set((state) => ({
        ...state,
        contextMenuOpen: true,
        contextMenuX: x,
        contextMenuY: y
      })),
    closeContextMenu: () =>
      set((state) => ({ ...state, contextMenuOpen: false })),

    setPhase: (phase) => set((state) => ({ ...state, phase })),
    armCaretNav: () => set((state) => ({ ...state, caretNavArmed: true })),
    setFocusedNodeKey: (key) =>
      set((state) => ({ ...state, focusedNodeKey: key })),
    setPendingStartKey: (key) =>
      set((state) => ({ ...state, pendingStartKey: key })),
    setPendingEndKey: (key) =>
      set((state) => ({ ...state, pendingEndKey: key })),
    openResetWindow: (x, y, expiresAt) =>
      set((state) => ({ ...state, resetWindow: { x, y, expiresAt } })),
    closeResetWindow: () =>
      set((state) => ({ ...state, resetWindow: null })),
    startDrag: (dragState) => set((state) => ({ ...state, dragState })),
    updateDrag: (patch) =>
      set((state) =>
        state.dragState
          ? { ...state, dragState: { ...state.dragState, ...patch } }
          : state
      ),
    endDrag: () => set((state) => ({ ...state, dragState: null })),
    openAnchorMenu: (nodeKey, anchorEl) =>
      set((state) => ({
        ...state,
        anchorMenuKey: nodeKey,
        anchorMenuEl: anchorEl
      })),
    closeAnchorMenu: () =>
      set((state) => ({ ...state, anchorMenuKey: null, anchorMenuEl: null })),

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
