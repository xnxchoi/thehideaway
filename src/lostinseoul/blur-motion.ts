export const LOST_BLUR_VIEWPORT_AMOUNT = 0.1;

export function splitLostBlurLines(text: string): string[] {
  const lines = text
    .split(/(?<=[.!?。！？])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.length > 1 ? lines : [text];
}

export function getLostBlurLineDelay(index: number, intervalMs: number) {
  return (index * intervalMs) / 1000;
}

export function getLostBlurViewportAmount() {
  return LOST_BLUR_VIEWPORT_AMOUNT;
}
