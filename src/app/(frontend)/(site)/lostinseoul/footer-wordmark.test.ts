import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  fitLostFooterWordmarkTexture,
  getLostFooterShaderPointer,
  LOST_FOOTER_SHADER_TUNING,
  shouldRenderLostFooterShader
} from "./footer-wordmark-texture";

const wrapper = readFileSync(join(__dirname, "footer-wordmark.tsx"), "utf8");
const shader = readFileSync(
  join(__dirname, "footer-wordmark-shader.tsx"),
  "utf8"
);
const fragmentShader = readFileSync(
  join(__dirname, "shaders/footer-wordmark.fragment.glsl"),
  "utf8"
);

describe("LOST footer wordmark shader", () => {
  it("uses footer-local copies of the Missing cursor-blur shaders", () => {
    expect(shader).toContain("./shaders/footer-wordmark.fragment.glsl");
    expect(shader).toContain("./shaders/footer-wordmark.vertex.glsl");
    expect(shader).not.toContain("@/components/layouts/Missing/shader");
    expect(wrapper).toContain("ssr: false");
    expect(wrapper).toContain("IntersectionObserver");
    expect(wrapper).toContain('rootMargin: "300px"');
    expect(wrapper).not.toContain("useSpring");
    expect(wrapper).not.toContain("useTransform");
  });

  it("keeps a static wordmark fallback for non-WebGL states", () => {
    expect(wrapper).toContain("prefers-reduced-motion: reduce");
    expect(wrapper).toContain("(hover: hover) and (pointer: fine)");
    expect(wrapper).toContain("LOSTINSEOUL");
    expect(shader).toContain("document.fonts.ready");
    expect(shader).toContain('"webglcontextlost"');
    expect(shader).toContain("onFailure");
    expect(shader).not.toContain("window.devicePixelRatio");
    expect(wrapper).not.toContain("shaderReady ? 0 : 1");
    expect(wrapper).toContain(
      'className="block text-center whitespace-nowrap"'
    );
    expect(wrapper).toContain("text-[clamp(3.5rem,15.7vw,30rem)]");
    expect(wrapper).not.toContain("text-[clamp(4rem,22vw,30rem)]");
  });

  it("composites the footer-local blur without an opaque black canvas", () => {
    expect(shader).toContain("mix-blend-screen");
  });

  it("does not ship Three.js shader includes that WebGL cannot compile", () => {
    expect(fragmentShader).not.toMatch(/#include\s*</);
  });

  it("redraws the canvas texture when route theme tokens change", () => {
    expect(shader).toContain("themeObserver.observe(document.documentElement");
    expect(shader).toContain('attributeFilter: ["data-theme"]');
    expect(shader).toContain("themeObserver.disconnect()");
  });

  it("fits oversized text into the available texture without stretching up", () => {
    expect(
      fitLostFooterWordmarkTexture({
        availableWidth: 900,
        measuredWidth: 1000
      })
    ).toEqual({ offsetX: 0, scaleX: 0.9 });
  });

  it("centers text that already fits without enlarging it", () => {
    expect(
      fitLostFooterWordmarkTexture({
        availableWidth: 1000,
        measuredWidth: 900
      })
    ).toEqual({ offsetX: 50, scaleX: 1 });
  });

  it("fails closed for invalid texture measurements", () => {
    expect(
      fitLostFooterWordmarkTexture({
        availableWidth: 0,
        measuredWidth: 0
      })
    ).toEqual({ offsetX: 0, scaleX: 1 });
  });

  it("maps footer-local pointers in the Missing shader coordinate system", () => {
    expect(
      getLostFooterShaderPointer({
        height: 100,
        localX: 75,
        localY: 25,
        width: 100
      })
    ).toEqual({ x: 37.5, y: 37.5 });
    expect(
      getLostFooterShaderPointer({
        height: 100,
        localX: 50,
        localY: 50,
        width: 100
      })
    ).toEqual({ x: 12.5, y: 12.5 });
  });

  it("uses a slower pointer trail and a four-times wider blur field", () => {
    expect(LOST_FOOTER_SHADER_TUNING).toEqual({
      blurRadiusScale: 4,
      pointerDamping: 3
    });
    expect(shader).toContain("BLUR_RADIUS_SCALE");
    expect(shader).toContain("blurRadiusScale.toFixed(1)");
    expect(shader).toContain("dampedPointer.copy(pointer)");
    expect(fragmentShader).toContain("/ BLUR_RADIUS_SCALE");
    expect(fragmentShader).toContain("vec4 blurredColor");
  });

  it("feathers the wide blur instead of drawing a bright rectangular bloom", () => {
    expect(shader).toContain("u_alpha: { value: 0.72 }");
    expect(fragmentShader).toContain("pow(blurInfluence, .65)");
    expect(fragmentShader).not.toContain("blurredColor * smoothstep");
  });

  it("renders only for capable near-viewport sessions", () => {
    expect(
      shouldRenderLostFooterShader({
        finePointer: true,
        nearViewport: true,
        reducedMotion: false,
        shaderFailed: false
      })
    ).toBe(true);
    expect(
      shouldRenderLostFooterShader({
        finePointer: true,
        nearViewport: false,
        reducedMotion: false,
        shaderFailed: false
      })
    ).toBe(false);
    expect(
      shouldRenderLostFooterShader({
        finePointer: true,
        nearViewport: true,
        reducedMotion: true,
        shaderFailed: false
      })
    ).toBe(false);
    expect(
      shouldRenderLostFooterShader({
        finePointer: true,
        nearViewport: true,
        reducedMotion: false,
        shaderFailed: true
      })
    ).toBe(false);
  });
});
