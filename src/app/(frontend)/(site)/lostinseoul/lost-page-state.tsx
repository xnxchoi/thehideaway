"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject
} from "react";
import type { LostEntryPhase } from "./entry-motion";
import { useLostEntrySequence } from "./use-lost-entry-sequence";

type LostBagValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

type LostSearchValue = {
  query: string;
  setQuery: (query: string) => void;
};

const LostBagContext = createContext<LostBagValue | null>(null);
const LostSearchContext = createContext<LostSearchValue | null>(null);
const LostCommerceRootContext =
  createContext<RefObject<HTMLElement | null> | null>(null);
const LostEntryPhaseContext = createContext<LostEntryPhase>("ready");
const LostMarkSceneReadyContext = createContext<() => void>(() => undefined);

export function LostChromeProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const commerceRootRef = useRef<HTMLElement>(null);
  const bag = useMemo(() => ({ open, setOpen }), [open]);
  const search = useMemo(() => ({ query, setQuery }), [query]);

  return (
    <LostBagContext.Provider value={bag}>
      <LostSearchContext.Provider value={search}>
        <LostCommerceRootContext.Provider value={commerceRootRef}>
          {children}
        </LostCommerceRootContext.Provider>
      </LostSearchContext.Provider>
    </LostBagContext.Provider>
  );
}

export function LostEntryProvider({ children }: { children: ReactNode }) {
  const [sceneReady, setSceneReady] = useState(false);
  const markSceneReady = useCallback(() => {
    setSceneReady(true);
  }, []);
  const phase = useLostEntrySequence(sceneReady);

  return (
    <LostMarkSceneReadyContext.Provider value={markSceneReady}>
      <LostEntryPhaseContext.Provider value={phase}>
        {children}
      </LostEntryPhaseContext.Provider>
    </LostMarkSceneReadyContext.Provider>
  );
}

export function useLostBag(): LostBagValue {
  const value = useContext(LostBagContext);
  if (!value) {
    throw new Error("useLostBag must be used within LostChromeProvider");
  }
  return value;
}

export function useLostSearch(): LostSearchValue {
  const value = useContext(LostSearchContext);
  if (!value) {
    throw new Error("useLostSearch must be used within LostChromeProvider");
  }
  return value;
}

export function useLostCommerceRootRef(): RefObject<HTMLElement | null> {
  const value = useContext(LostCommerceRootContext);
  if (!value) {
    throw new Error(
      "useLostCommerceRootRef must be used within LostChromeProvider"
    );
  }
  return value;
}

export function useLostEntryPhase(): LostEntryPhase {
  return useContext(LostEntryPhaseContext);
}

export function useLostMarkSceneReady(): () => void {
  return useContext(LostMarkSceneReadyContext);
}
