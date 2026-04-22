"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { createStore, type StoreApi, useStore } from "zustand";

import type { EditorContext } from "../types";

/**
 * Transient store for the RP context-menu shell. The store only holds the
 * *open* state and the resolved snapshot — contributor output is computed on
 * open and re-computed on any state change via the registry, not memoized
 * here.
 *
 * A provider per editor lets nested editors each own their own menu.
 */

export interface CtxMenuStoreState {
  open: boolean;
  /** Viewport coords of the anchor (right-click / programmatic open point). */
  x: number;
  y: number;
  /** Snapshot captured at open. Null while closed. */
  context: EditorContext | null;

  openMenu: (args: { x: number; y: number; context: EditorContext }) => void;
  closeMenu: () => void;
  setPosition: (args: { x: number; y: number }) => void;
}

const INITIAL = {
  open: false,
  x: 0,
  y: 0,
  context: null as EditorContext | null
};

const createCtxMenuStore = () =>
  createStore<CtxMenuStoreState>()((set) => ({
    ...INITIAL,

    openMenu: ({ x, y, context }) => set({ open: true, x, y, context }),
    closeMenu: () => set({ open: false, context: null }),
    setPosition: ({ x, y }) => set({ x, y })
  }));

export type CtxMenuStoreApi = StoreApi<CtxMenuStoreState>;

const CtxMenuStoreContext = createContext<CtxMenuStoreApi | undefined>(
  undefined
);

export function CtxMenuStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<CtxMenuStoreApi>(null!);
  if (!storeRef.current) {
    storeRef.current = createCtxMenuStore();
  }
  return (
    <CtxMenuStoreContext.Provider value={storeRef.current}>
      {children}
    </CtxMenuStoreContext.Provider>
  );
}

export function useCtxMenuStore<T>(selector: (s: CtxMenuStoreState) => T): T {
  const store = useContext(CtxMenuStoreContext);
  if (!store) {
    throw new Error(
      "useCtxMenuStore must be used within <CtxMenuStoreProvider>"
    );
  }
  return useStore(store, selector);
}

export function useCtxMenuStoreApi(): CtxMenuStoreApi {
  const store = useContext(CtxMenuStoreContext);
  if (!store) {
    throw new Error(
      "useCtxMenuStoreApi must be used within <CtxMenuStoreProvider>"
    );
  }
  return store;
}
