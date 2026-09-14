"use client";
import { MotionValue, useMotionValue } from "motion/react";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect
} from "react";

type CRDNTS = {
  x: MotionValue<number>;
  y: MotionValue<number>;
};
type CRDNTSACT = {
  unsetFn: () => void;
  setFn: () => void;
};
export type CRDNTSAPI = CRDNTS & CRDNTSACT;
const CRDNTSCTX = createContext<CRDNTSAPI | null>(null);
export const CoordinatorCtx = ({ children }: { children: ReactNode }) => {
  const xValue = useMotionValue(0);
  const yValue = useMotionValue(0);
  useEffect(() => {
    xValue.set(window.innerWidth / 2);
    yValue.set(window.innerHeight / 2);
  }, [xValue, yValue]);
  const _updateFn = useCallback(
    (e: { x: number; y: number }) => {
      xValue.set(e.x);
      yValue.set(e.y);
    },
    [xValue, yValue]
  );
  const uup = useCallback(
    (e: PointerEvent) => {
      const xv = e.clientX;
      const yv = e.clientY;
      _updateFn({ x: xv, y: yv });
    },
    [_updateFn]
  );
  const setFn = useCallback(() => {
    document.addEventListener("pointermove", uup, { passive: true });
  }, [uup]);
  const unsetFn = useCallback(() => {
    document.removeEventListener("pointermove", uup);
  }, [uup]);
  useEffect(() => {
    setFn();
    return unsetFn;
  }, [setFn, unsetFn]);

  return (
    <CRDNTSCTX value={{ x: xValue, y: yValue, setFn, unsetFn }}>
      {children}
    </CRDNTSCTX>
  );
};
export const useCoordinator = <T,>(selector: (store: CRDNTSAPI) => T) => {
  const cc = useContext(CRDNTSCTX);
  if (!cc) {
    throw new Error("useCoordinator must be used within CoordinatorCtx");
  }
  return selector(cc);
};
