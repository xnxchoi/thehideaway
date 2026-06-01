export const lostProductStoryFigureTransition = {
  duration: 0.8,
  ease: [0.6, 0, 0.4, 1]
} as const;

export function clampLostProductStoryIndex(index: number, imageCount: number) {
  if (imageCount <= 0) return 0;
  return Math.min(imageCount - 1, Math.max(0, index));
}

export function getLostProductStoryFigureState(
  index: number,
  activeIndex: number
) {
  if (index === activeIndex) {
    return {
      opacity: 1,
      scale: 1,
      y: 0,
      zIndex: 2
    };
  }

  if (index < activeIndex) {
    return {
      opacity: 0,
      scale: 1.04,
      y: 0,
      zIndex: 1
    };
  }

  return {
    opacity: 0,
    scale: 1.02,
    y: "100%",
    zIndex: 0
  };
}

export function getLostProductStoryProgressClassName(
  index: number,
  activeIndex: number
) {
  return [
    "lost-product-progress-bar",
    index <= activeIndex ? "is-active" : null
  ]
    .filter(Boolean)
    .join(" ");
}
