const LOST_HERO_SCROLL_DEADZONE = 0.001;
const LOST_HERO_DESKTOP_MIN_WIDTH = 768;
const LOST_HERO_SCROLL_VIEWPORT_MULTIPLIER = 1.2;
const LOST_HERO_MAX_SCROLL_PX = 800;

export function getLostHeroScrollProgress(
  scrollY: number,
  viewportHeight: number,
  viewportWidth: number
) {
  if (
    !Number.isFinite(scrollY) ||
    !Number.isFinite(viewportHeight) ||
    !Number.isFinite(viewportWidth) ||
    viewportWidth < LOST_HERO_DESKTOP_MIN_WIDTH
  ) {
    return 0;
  }
  const scrollRange = Math.min(
    viewportHeight * LOST_HERO_SCROLL_VIEWPORT_MULTIPLIER,
    LOST_HERO_MAX_SCROLL_PX
  );
  if (scrollRange <= 0) return 0;
  const progress = scrollY / scrollRange;
  const clamped = Math.min(Math.max(progress, 0), 1);
  return clamped < LOST_HERO_SCROLL_DEADZONE ? 0 : clamped;
}
