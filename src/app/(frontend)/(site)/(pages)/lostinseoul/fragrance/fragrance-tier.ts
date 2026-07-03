export type LostFragranceRenderTier = "webgl" | "video" | "editorial";

// navigator.deviceMemory rounds to powers of two and caps at 8; mid-tier
// Android reports exactly 4, so the mobile gate is inclusive. Safari/Firefox
// never report (null) — those devices run webgl at the reduced mobile DPR.
const LOST_FRAGRANCE_MAX_GATED_MOBILE_MEMORY_GB = 4;

export function getLostFragranceRenderTier({
  prefersReducedMotion,
  webglSupported,
  deviceMemoryGb,
  isMobile
}: {
  prefersReducedMotion: boolean;
  webglSupported: boolean;
  deviceMemoryGb: number | null;
  isMobile: boolean;
}): LostFragranceRenderTier {
  if (prefersReducedMotion) return "editorial";
  if (!webglSupported) return "video";
  if (
    isMobile &&
    deviceMemoryGb !== null &&
    deviceMemoryGb <= LOST_FRAGRANCE_MAX_GATED_MOBILE_MEMORY_GB
  ) {
    return "video";
  }
  return "webgl";
}

export function readLostFragranceTierInput(): {
  prefersReducedMotion: boolean;
  webglSupported: boolean;
  deviceMemoryGb: number | null;
  isMobile: boolean;
} {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  const deviceMemoryGb = typeof memory === "number" ? memory : null;

  let webglSupported = false;
  try {
    const canvas = document.createElement("canvas");
    webglSupported = Boolean(
      canvas.getContext("webgl2") ?? canvas.getContext("webgl")
    );
  } catch {
    webglSupported = false;
  }

  return { prefersReducedMotion, webglSupported, deviceMemoryGb, isMobile };
}
