"use client";
import type { ReactNode } from "react";
import { createContext, useContext, useMemo } from "react";
import { useStore } from "zustand";
import { createBridge, type HandoffBridgeStore } from "./ct";
export type EditorBridge = ReturnType<typeof createBridge>;

export const EditorBridgedContext = createContext<EditorBridge | undefined>(
  undefined
);

export const HandoffBridge = ({ children }: { children: ReactNode }) => {
  // Use useMemo to ensure store is created only once and prevent hydration issues
  const store = useMemo(() => createBridge(), []);

  return (
    <EditorBridgedContext.Provider value={store}>
      {children}
    </EditorBridgedContext.Provider>
  );
};

export const useHandoff = <T,>(selector: (store: HandoffBridgeStore) => T) => {
  const store = useContext(EditorBridgedContext);
  if (!store) {
    throw new Error("useHandoff must be used within a HandoffBridge");
  }
  return useStore(store, selector);
};
