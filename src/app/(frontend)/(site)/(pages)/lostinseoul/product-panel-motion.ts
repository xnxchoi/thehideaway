export const lostProductPanelTransition = {
  duration: 0.8,
  ease: [0.6, 0, 0.3, 1]
} as const;

export function getLostProductPanelState(open: boolean) {
  return open
    ? {
        opacity: 1,
        pointerEvents: "auto" as const,
        visibility: "visible" as const,
        y: "0%"
      }
    : {
        opacity: 0,
        pointerEvents: "none" as const,
        transitionEnd: { visibility: "hidden" as const },
        visibility: "hidden" as const,
        y: "-100%"
      };
}

export function getLostProductPanelFigureState(open: boolean) {
  return open ? { y: "0%" } : { y: "-8%" };
}
