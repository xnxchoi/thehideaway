"use client";
import rangey from "@/components/UX/Highlightr/rangey";
import {
  createContext,
  type ReactNode,
  RefObject,
  useContext,
  useRef
} from "react";
import { createStore, useStore } from "zustand";

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
      break;
    }
  }
  return tg.current;
};

type RangerAPI = ReturnType<typeof createRanger>;
const RangerContext = createContext<RangerAPI>(null!);
export const RangerProvider = ({ children }: { children: ReactNode }) => {
  const rangerRef = useRef<RangerAPI>(null!);
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
