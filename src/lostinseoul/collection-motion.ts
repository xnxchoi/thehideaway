export type LostCollectionMotionState = "active" | "inactive" | "leaving";

export const lostCollectionTransition = {
  duration: 1,
  ease: [0.6, 0, 0.3, 1]
} as const;

export function getLostCollectionVideoState(
  state: LostCollectionMotionState
) {
  if (state === "active") {
    return { opacity: 1, x: "0%", zIndex: 2 };
  }

  if (state === "leaving") {
    return { opacity: 1, x: "-8%", zIndex: 1 };
  }

  return { opacity: 0, x: "100%", zIndex: 0 };
}

export function getLostCollectionTagState(state: LostCollectionMotionState) {
  if (state === "active") {
    return { opacity: 1, y: "0%" };
  }

  if (state === "leaving") {
    return { opacity: 0, y: "-100%" };
  }

  return { opacity: 0, y: "100%" };
}
