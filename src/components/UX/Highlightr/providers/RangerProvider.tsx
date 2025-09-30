"use client";

import {
  createContext,
  type ReactNode,
  RefObject,
  use,
  useContext,
  useRef
} from "react";
import { createStore, useStore } from "zustand";

const ranger = import("@/components/UX/Highlightr/providers/rangey").then(
  (r) => r.default
);
export type RangerState = {
  ranger: rangy.RangyStatic;
  highlighter: rangy.RangyHighlighter;
  classApplier: rangy.RangyClassApplier;
  targetContainer: HTMLElement;
};
export type RangerAct = {
  setTargetContainer: (container: HTMLElement | null) => void;
};
export type RangerStore = RangerState & RangerAct;
export const createRanger = ({ ranger }: { ranger: rangy.RangyStatic }) => {
  ranger.init();
  const highlighter = ranger.createHighlighter();
  const classApplier = ranger.createClassApplier("highlighted", {
    ignoreWhiteSpace: true,
    elementTagName: "mark",
    normalize: true
  });
  return createStore<RangerStore>()((set) => ({
    ranger,
    highlighter,
    classApplier,
    targetContainer: document.body,
    setTargetContainer: (container: HTMLElement | null) =>
      set({ targetContainer: container || document.body })
  }));
};

export const waiting = async (tg: RefObject<HTMLElement>) => {
  let msCount = 0;
  while (!tg.current) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    msCount++;
    if (msCount > 350) {
      throw new Error("Target container not found");
    }
  }
  return tg.current;
};
type RangerAPI = ReturnType<typeof createRanger>;
const RangerContext = createContext<RangerAPI>(null!);
export const RangerProvider = ({ children }: { children: ReactNode }) => {
  return <A ranger={ranger}>{children}</A>;
};
const A = ({
  children,
  ranger
}: {
  children: ReactNode;
  ranger: Promise<rangy.RangyStatic>;
}) => {
  const rangerRef = useRef<RangerAPI>(null!);
  const rangey = use(ranger);
  if (!rangerRef.current) {
    rangerRef.current = createRanger({ ranger: rangey });
  }
  return (
    <RangerContext.Provider value={rangerRef.current}>
      {children}
    </RangerContext.Provider>
  );
};
export const useRanger = <T,>(
  selector: (state: RangerStore) => T,
  targetContainer?: RefObject<HTMLElement>
) => {
  const ctx = useContext(RangerContext);
  if (!ctx) {
    throw new Error("useRanger must be used within a RangerProvider");
  }
  if (targetContainer) {
    waiting(targetContainer).then((tg) => {
      ctx.getState().setTargetContainer(tg);
    });
  }
  return useStore(ctx, selector);
};
