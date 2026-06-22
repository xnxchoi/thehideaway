const CANVAS_SIZE = 32;
const ROUGE = "#a4031f";
const DEFAULT_GLINT_DURATION_MS = 3600;
const DEFAULT_GLINT_INTERVAL_MS = 5400;
const DEFAULT_SURFACE_AREA_SCALE = 10;
const DEFAULT_TARGET_FPS = 30;
const GLINT_ANCHOR = {
  x: 20,
  y: 12
};
const BASE_PRIMARY_SIDE = 5.5;
const BASE_SECONDARY_SIDE = BASE_PRIMARY_SIDE * 0.28;
const BASE_GLINT_SURFACE_AREA =
  BASE_PRIMARY_SIDE ** 2 + BASE_SECONDARY_SIDE ** 2;
const GLINT_FACETS = [
  { alpha: 0.9, phase: 0, weight: 0.17, x: 0, y: 0 },
  { alpha: 0.68, phase: 0.06, weight: 0.14, x: -4.2, y: 3.5 },
  { alpha: 0.58, phase: 0.1, weight: 0.13, x: 3.9, y: 2.8 },
  { alpha: 0.52, phase: 0.14, weight: 0.12, x: -6.8, y: -0.8 },
  { alpha: 0.48, phase: 0.18, weight: 0.11, x: 1.4, y: -4.5 },
  { alpha: 0.42, phase: 0.22, weight: 0.1, x: -1.8, y: 7.1 },
  { alpha: 0.36, phase: 0.26, weight: 0.09, x: 6.2, y: -1.4 },
  { alpha: 0.32, phase: 0.3, weight: 0.08, x: -8.2, y: 5.9 },
  { alpha: 0.28, phase: 0.34, weight: 0.06, x: 4.7, y: 6.4 }
];

let baseImage = null;
let canvas = null;
let context = null;
let frameTimer = null;
let glintTimer = null;
let settings = {
  frameCount: Math.round(
    DEFAULT_GLINT_DURATION_MS / (1000 / DEFAULT_TARGET_FPS)
  ),
  frameDuration: 1000 / DEFAULT_TARGET_FPS,
  interval: DEFAULT_GLINT_INTERVAL_MS,
  surfaceAreaScale: DEFAULT_SURFACE_AREA_SCALE
};

const clampNumber = (value, fallback, min, max) => {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
};

const stopAnimation = () => {
  if (frameTimer) {
    clearTimeout(frameTimer);
  }

  if (glintTimer) {
    clearTimeout(glintTimer);
  }

  frameTimer = null;
  glintTimer = null;
};

const postError = (message) => {
  stopAnimation();
  self.postMessage({ message, type: "favicon:error" });
};

const readAsDataUrl = (blob) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(reader.error);
    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read favicon frame"));
    };

    reader.readAsDataURL(blob);
  });

const postFrame = async () => {
  const blob = await canvas.convertToBlob({ type: "image/png" });
  const dataUrl = await readAsDataUrl(blob);

  self.postMessage({ dataUrl, type: "updateFavicon" });
};

const drawBaseFrame = () => {
  context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  context.drawImage(baseImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
};

const drawDiamond = (x, y, sideLength, alpha) => {
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = ROUGE;
  context.translate(x, y);
  context.rotate(Math.PI / 4);
  context.fillRect(-sideLength / 2, -sideLength / 2, sideLength, sideLength);
  context.restore();
};

const drawGlintFrame = (frameIndex) => {
  const totalFrames = Math.max(settings.frameCount - 1, 1);
  const progress = frameIndex / totalFrames;
  const intensity = Math.sin(progress * Math.PI);
  const targetArea =
    BASE_GLINT_SURFACE_AREA * settings.surfaceAreaScale * intensity;
  const alpha = 0.035 + intensity * 0.14;
  const drift = (progress - 0.5) * 2.2;

  drawBaseFrame();

  if (targetArea <= 0) {
    return;
  }

  for (const facet of GLINT_FACETS) {
    const facetProgress = Math.min(progress + facet.phase, 1);
    const facetIntensity = Math.sin(facetProgress * Math.PI);
    const sideLength = Math.sqrt(targetArea * facet.weight);
    const facetDrift = drift * (1 - facet.phase * 0.8);

    drawDiamond(
      GLINT_ANCHOR.x + facet.x + facetDrift,
      GLINT_ANCHOR.y + facet.y - facetDrift * 0.25,
      sideLength,
      alpha * facet.alpha * Math.max(facetIntensity, 0.18)
    );
  }
};

const scheduleNextGlint = () => {
  glintTimer = setTimeout(runGlint, settings.interval);
};

const runGlint = () => {
  let frameIndex = 0;

  const drawNextFrame = async () => {
    try {
      drawGlintFrame(frameIndex);
      await postFrame();
      frameIndex += 1;

      if (frameIndex >= settings.frameCount) {
        drawBaseFrame();
        await postFrame();
        scheduleNextGlint();
        return;
      }

      frameTimer = setTimeout(drawNextFrame, settings.frameDuration);
    } catch (error) {
      postError(
        error instanceof Error ? error.message : "Unable to render favicon frame"
      );
    }
  };

  void drawNextFrame();
};

const hasRequiredRuntime = () =>
  typeof OffscreenCanvas === "function" &&
  typeof createImageBitmap === "function" &&
  typeof FileReader === "function" &&
  typeof fetch === "function";

const readSettings = (message) => {
  const targetFps = clampNumber(
    message.targetFps,
    DEFAULT_TARGET_FPS,
    15,
    40
  );
  const glintDuration = clampNumber(
    message.glintDuration,
    DEFAULT_GLINT_DURATION_MS,
    900,
    6000
  );
  const surfaceAreaScale = clampNumber(
    message.surfaceAreaScale,
    DEFAULT_SURFACE_AREA_SCALE,
    1,
    16
  );
  const frameDuration = 1000 / targetFps;

  return {
    frameCount: Math.max(5, Math.round(glintDuration / frameDuration)),
    frameDuration,
    interval: clampNumber(
      message.interval,
      DEFAULT_GLINT_INTERVAL_MS,
      2400,
      12000
    ),
    surfaceAreaScale
  };
};

self.onmessage = async (event) => {
  if (event.data?.type === "stop") {
    stopAnimation();
    return;
  }

  if (event.data?.type !== "init") {
    return;
  }

  stopAnimation();

  if (!hasRequiredRuntime()) {
    postError("Animated favicon rendering is not supported");
    return;
  }

  try {
    settings = readSettings(event.data);
    canvas = new OffscreenCanvas(CANVAS_SIZE, CANVAS_SIZE);
    context = canvas.getContext("2d");

    if (!context) {
      postError("Unable to create favicon canvas context");
      return;
    }

    const response = await fetch(event.data.baseImage, { mode: "cors" });

    if (!response.ok) {
      postError("Unable to load favicon image");
      return;
    }

    const blob = await response.blob();
    baseImage = await createImageBitmap(blob);

    drawBaseFrame();
    await postFrame();
    scheduleNextGlint();
  } catch (error) {
    postError(
      error instanceof Error ? error.message : "Unable to load favicon image"
    );
  }
};
