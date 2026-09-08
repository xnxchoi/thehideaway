type MediaDimensions = {
  height?: number | null;
  width?: number | null;
};

export function shouldShowLostHeroVideoControls(videoUrl?: string | null) {
  return getLostHeroVideoUrl(videoUrl) !== null;
}

export function getLostHeroVideoUrl(videoUrl?: string | null) {
  const normalized = videoUrl?.trim();

  return normalized ? normalized : null;
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
