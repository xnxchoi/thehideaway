type MediaDimensions = {
  height?: number | null;
  width?: number | null;
};

export function shouldShowLostHeroVideoControls(videoUrl?: string | null) {
  return Boolean(videoUrl?.trim());
}

export function getLostHeroTextureMediaRatio(
  dimensions: MediaDimensions | null | undefined,
  fallbackRatio: number
) {
  const width = dimensions?.width ?? 0;
  const height = dimensions?.height ?? 0;

  if (width <= 0 || height <= 0) return fallbackRatio;

  return width / height;
}
