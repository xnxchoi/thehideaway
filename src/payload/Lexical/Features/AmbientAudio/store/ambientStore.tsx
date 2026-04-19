"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createStore, type StoreApi, useStore } from "zustand";

import type { AnchorKind } from "../nodes/types";

export type AmbientMode = "idle" | "selecting" | "placing";

export interface AmbientStoreState {
  mode: AmbientMode;
  pendingGroupId: string | null;
  pendingAnchor: AnchorKind | null;
  pickerOpen: boolean;
  pickerAnchorEl: HTMLElement | null;
  pickerGroupId: string | null;
  contextMenuOpen: boolean;
  contextMenuX: number;
  contextMenuY: number;

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
  reset: () => void;
}

const createAmbientStore = () =>
  createStore<AmbientStoreState>()((set) => ({
    mode: "idle",
    pendingGroupId: null,
    pendingAnchor: null,
    pickerOpen: false,
    pickerAnchorEl: null,
    pickerGroupId: null,
    contextMenuOpen: false,
    contextMenuX: 0,
    contextMenuY: 0,

    enterSelectMode: () =>
      set((state) => ({
        ...state,
        mode: "selecting",
        contextMenuOpen: false
      })),
    exitSelectMode: () =>
      set((state) => ({
        ...state,
        mode: "idle",
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
        pickerGroupId: groupId
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
    reset: () =>
      set({
        mode: "idle",
        pendingGroupId: null,
        pendingAnchor: null,
        pickerOpen: false,
        pickerAnchorEl: null,
        pickerGroupId: null,
        contextMenuOpen: false,
        contextMenuX: 0,
        contextMenuY: 0
      } as Partial<AmbientStoreState>)
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
