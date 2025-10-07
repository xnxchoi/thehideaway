"use client";
import { Concat, join } from "@/utilities/typeUtilities";
import { VIEW_DIMENSIONS } from "@/constants/animations";
import { createStore } from "zustand/vanilla";

type VerticalFrame = "top" | "bottom";
type LateralFrame = "right" | "left";
export type FrameSide = VerticalFrame | LateralFrame;
export type CornerSide = Concat<[VerticalFrame, LateralFrame]>;

const vwVh = /^-?\b\d{1,3}(v(w|h))\b/;
const vwTest = /(?<=(-?\b\d{1,3}))(vw)/;
const vhTest = /(?<=(-?\b\d{1,3}))(vh)/;
const viewDimensions = (viewport: string) => {
  if (!window) return 0;
  if (vwVh.test(viewport)) {
    const vw = vwTest.exec(viewport);
    const vh = vhTest.exec(viewport);
    if (vw) {
      return 0.01 * parseInt(vw[0], 10) * window.innerWidth;
    }
    if (vh) {
      return 0.01 * parseInt(vh[0], 10) * window.innerHeight;
    }
  }
  return 0;
};

type MenuStructure = Record<FrameSide, number> & {
  base: { [x in FrameSide]: number };
};

type MenuStructureActions = {
  setFrame: (props: Partial<{ [x in FrameSide]: number | string }>) => void;
  setBase: (props: Partial<{ [x in FrameSide]: number }>) => void;
  resetFrames: () => void;
};

const initMenus: MenuStructure = {
  top: 10,
  right: 10,
  bottom: 30,
  left: 10,
  base: {
    top: 10,
    right: 10,
    bottom: 30,
    left: 10
  }
};
export type RP_BluePrint = MenuStructure & MenuStructureActions;

export const createMenuStructure = (initState: MenuStructure = initMenus) => {
  return createStore<RP_BluePrint>()((set) => ({
    ...initState,
    setFrame: (props: Partial<{ [x in FrameSide]: number | string }>) =>
      set((state) => {
        const temp = { ...initMenus };
        for (const [key, value] of Object.entries(props)) {
          if (typeof value === "string") {
            temp[key as FrameSide] = viewDimensions(value);
          } else {
            temp[key as FrameSide] = value;
          }
        }
        return {
          ...state,
          ...temp
        };
      }),
    resetFrames: () =>
      set((state) => {
        return {
          ...state,
          left: state.base.left,
          right: state.base.right,
          top: state.base.top,
          bottom: state.base.bottom
        };
      }),
    setBase: (props: Partial<{ [x in FrameSide]: number }>) =>
      set((state) => {
        const temp = { ...initMenus.base };
        for (const [key, value] of Object.entries(props)) {
          temp[key as FrameSide] = value;
        }
        return { ...state, ...temp };
      })
  }));
};
