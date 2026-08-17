export const LOST_FOOTER_SHADER_TUNING = Object.freeze({
  blurRadiusScale: 4,
  pointerDamping: 3
});

export function fitLostFooterWordmarkTexture({
  availableWidth,
  measuredWidth
}: {
  availableWidth: number;
  measuredWidth: number;
}): { offsetX: number; scaleX: number } {
  if (availableWidth <= 0 || measuredWidth <= 0) {
    return { offsetX: 0, scaleX: 1 };
  }

  const scaleX = Math.min(1, availableWidth / measuredWidth);
  const renderedWidth = measuredWidth * scaleX;

  return {
    offsetX: (availableWidth - renderedWidth) / 2,
    scaleX
  };
}

export function getLostFooterShaderPointer({
  height,
  localX,
  localY,
  width
}: {
  height: number;
  localX: number;
  localY: number;
  width: number;
}): { x: number; y: number } {
  // Missing's VAR 45 branch subtracts 0.125 * resolution after converting
  // fragment coordinates around the canvas center. Feed that expected uniform
  // space directly so the blur center stays registered to the local pointer.
  return {
    x: localX - width * 0.375,
    y: height * 0.625 - localY
  };
}

export function shouldRenderLostFooterShader({
  finePointer,
  nearViewport,
  reducedMotion,
  shaderFailed
}: {
  finePointer: boolean;
  nearViewport: boolean;
  reducedMotion: boolean;
  shaderFailed: boolean;
}): boolean {
  return finePointer && nearViewport && !reducedMotion && !shaderFailed;
}
