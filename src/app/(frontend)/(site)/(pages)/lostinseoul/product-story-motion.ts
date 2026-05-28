export type LostProductStoryFigureState = "rest" | "hover";

export const lostProductStoryFigureTransition = {
  duration: 0.8,
  ease: [0.6, 0, 0.4, 1]
} as const;

export function getLostProductStoryFigureState(
  index: number,
  state: LostProductStoryFigureState
) {
  if (index === 0) {
    return {
      opacity: 1,
      scale: 1,
      y: 0,
      zIndex: 0
    };
  }

  if (index === 1) {
    return {
      opacity: state === "hover" ? 1 : 0,
      scale: state === "hover" ? 1 : 1.02,
      y: 0,
      zIndex: 1
    };
  }

  return {
    opacity: 0,
    scale: 1,
    y: "100%",
    zIndex: 0
  };
}
