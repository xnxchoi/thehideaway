/**
 * The Catalyst reaction — the abstract ember plume rooted on black water.
 *
 * This is the founder-blessed look (2026-07-12): no bottle, no product
 * render — the HERO is the reaction itself. A sodium-ember plume rises
 * against ~95% black, rooted on a rippling water surface that its own
 * firelight breaks open. Scroll drives one continuous intensity curve:
 * colourless → contact → ignition → afterglow.
 *
 * Every visual number here was dialed by hand on the look-candidate
 * artifact (claude.ai artifact d927c1de, "v12" values) and is baked as a
 * GLSL constant — the production scene has no tuner and no uniforms
 * beyond resolution, time, and scroll progress.
 *
 * See readmes/LOSTINSEOUL_FRAGRANCE.md §10 for the direction pivot.
 */

/** Scroll-progress boundaries of the reaction intensity curve. */
export const LOST_FRAGRANCE_REACTION_CURVE = {
  /** Below this the scene is colourless — dormant water, no ember. */
  igniteStart: 0.3,
  /** Full ignition — the plume at its peak. */
  igniteEnd: 0.72,
  /** Afterglow begins to pull the reaction back down… */
  afterStart: 0.84,
  /** …settling at half intensity by the end of the chapter. */
  afterDepth: 0.5
} as const;

/** The founder's baked look — v12 of the look-candidate, verbatim. */
export const LOST_FRAGRANCE_REACTION_LOOK = {
  plumeGain: 1.33,
  plumeLift: -0.14,
  glow: 0.47,
  waterY: -0.115,
  reflReach: 5.45,
  shimmer: 0.87,
  disp: 0.27,
  ripFreq: 29.5,
  ring: 0.12,
  sparkle: 4.4,
  exposure: 1.83,
  /**
   * Dormant sheen — "dark but visible": before ignition the water is never
   * pure black; a breath of light catches the ripple crests and fades out
   * as the reaction takes over. 0 = the old pitch-black dormant.
   */
  dormant: 1.0
} as const;

/**
 * The 2D camera rig — the scroll orchestration layer.
 *
 * The reaction is a flat field, but the frame is not static: scroll walks
 * the camera through the chapter. `zoom > 1` is closer (a smaller slice of
 * the scene fills the screen), `y` is the scene height at frame centre.
 * Dormant opens low and close over the water — the ripples ARE the shot —
 * then the frame pulls back and rises as the plume takes it.
 */
export const LOST_FRAGRANCE_REACTION_CAMERA = [
  { progress: 0, zoom: 1.34, y: -0.09 }, // low over the black water, close
  { progress: 0.3, zoom: 1.2, y: -0.045 }, // contact — starting to lift
  { progress: 0.55, zoom: 1, y: 0 }, // pulled back; the plume owns the frame
  { progress: 0.78, zoom: 1.09, y: 0.035 }, // slow push-in at peak
  { progress: 1, zoom: 0.95, y: 0.085 } // recede + rise into the afterglow
] as const;

export type LostFragranceReactionCamera = { zoom: number; y: number };

/** Sample the camera rig at a scroll progress (clamped, eased per segment). */
export function getLostFragranceReactionCamera(
  progress: number
): LostFragranceReactionCamera {
  const keys = LOST_FRAGRANCE_REACTION_CAMERA;
  const first = keys[0];
  const last = keys[keys.length - 1];
  if (progress <= first.progress) return { y: first.y, zoom: first.zoom };
  if (progress >= last.progress) return { y: last.y, zoom: last.zoom };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (progress > b.progress) continue;
    const t = smoothstep(a.progress, b.progress, progress);
    return {
      y: a.y + (b.y - a.y) * t,
      zoom: a.zoom + (b.zoom - a.zoom) * t
    };
  }
  return { y: last.y, zoom: last.zoom };
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * TS twin of the shader's intensity curve — the single scroll→reaction
 * mapping, used for tests and any DOM layer that wants to breathe with
 * the light (the GLSL below is generated from the same constants).
 */
export function getLostFragranceReactionIntensity(progress: number): number {
  const { igniteStart, igniteEnd, afterStart, afterDepth } =
    LOST_FRAGRANCE_REACTION_CURVE;
  const ignite = smoothstep(igniteStart, igniteEnd, progress);
  const after = smoothstep(afterStart, 1, progress) * afterDepth;
  return ignite - after;
}

const glslFloat = (value: number): string => {
  const s = String(value);
  return s.includes(".") || s.includes("e") ? s : `${s}.0`;
};

const CURVE = LOST_FRAGRANCE_REACTION_CURVE;
const LOOK = LOST_FRAGRANCE_REACTION_LOOK;

export const LOST_FRAGRANCE_REACTION_VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p,0.,1.); }`;

export const LOST_FRAGRANCE_REACTION_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uProg;
uniform float uCamZoom;
uniform float uCamY;

float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash(i), b=hash(i+vec2(1,0)), c=hash(i+vec2(0,1)), d=hash(i+vec2(1,1));
  vec2 u=f*f*(3.-2.*f);
  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.55; mat2 m=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<6;i++){ v+=a*noise(p); p=m*p+0.03; a*=0.5; }
  return v;
}
// domain-warped turbulence — organic ink, not smoke
float turb(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0.0, t*0.10)), fbm(p + vec2(5.2,1.3) - t*0.06));
  vec2 r = vec2(fbm(p + 3.4*q + vec2(1.7,9.2) + t*0.04), fbm(p + 3.4*q + vec2(8.3,2.8)));
  return fbm(p + 3.6*r);
}
// deep sodium-ember ramp — one hue, committed; never white.
// Warm-shifted toward amber (founder: pure-red read as a regression on a
// real display) — green lifted through the ramp, red held.
vec3 ember(float h){
  h = clamp(h,0.0,1.0);
  vec3 c = vec3(0.0);
  c += vec3(0.39,0.110,0.018) * smoothstep(0.05,0.32,h);
  c += vec3(0.46,0.225,0.052) * smoothstep(0.30,0.62,h);
  c += vec3(0.43,0.310,0.125) * smoothstep(0.62,0.98,h);
  return c;
}
// the plume heat field at any point — reused for the water reflection
float plumeHeat(vec2 uv, float t, float intensity){
  vec2 o = vec2(0.0, ${glslFloat(LOOK.plumeLift)});
  vec2 d = uv - o;
  vec2 sp = vec2(d.x*2.6, d.y*1.6) + vec2(0.0, -t*0.15);
  float f = turb(sp*1.2, t);
  float height = clamp(d.y*0.9 + 0.40, 0.0, 1.4);
  float widthMask = exp(-pow(abs(d.x) / (0.065 + height*0.26), 2.0));
  float vertMask  = smoothstep(-0.34, -0.02, d.y) * (1.0 - smoothstep(0.35, 0.95, d.y));
  float coreGlow  = exp(-dot(d*vec2(1.7,1.0), d*vec2(1.7,1.0)) * 5.0);
  float density = f * widthMask * vertMask;
  density = pow(max(density,0.0), 1.7);
  return (density*1.25 + coreGlow*0.28) * intensity;
}
// one expanding concentric ripple — a narrow wavefront fading over its life
float ripRing(vec2 p, vec2 o, float age, float life){
  float d = length((p - o) * vec2(1.0, 3.4));
  float radius = age * 0.045;
  float front = exp(-pow((d - radius) * 22.0, 2.0));
  float wave = sin((d - radius) * 130.0);
  float fade = smoothstep(0.0, 0.7, age) * (1.0 - smoothstep(life*0.55, life, age));
  return wave * front * fade;
}
// quiet, occasional ripples: slow emitters with long gaps between rings
float waterRipples(vec2 p, float t){
  float h = 0.0;
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    float life = 5.5;
    float period = 8.0 + fi * 4.0;
    float phase = fi * 0.53;
    float cyc = floor(t / period + phase);
    float age = fract(t / period + phase) * period;
    vec2 o = vec2((hash(vec2(cyc*1.7 + 3.0, fi*3.1)) - 0.5) * 1.5,
                  0.04 + hash(vec2(fi*2.3, cyc*1.1 + 1.0)) * 0.34);
    h += ripRing(p, o, age, life);
  }
  return h;
}
void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes) / uRes.y;
  // the 2D camera rig: zoom > 1 pushes in, uCamY lifts/lowers the frame
  uv = uv / uCamZoom;
  uv.y += uCamY;
  float t = uTime;

  float ignite = smoothstep(${glslFloat(CURVE.igniteStart)}, ${glslFloat(CURVE.igniteEnd)}, uProg);
  float after  = smoothstep(${glslFloat(CURVE.afterStart)}, 1.0, uProg) * ${glslFloat(CURVE.afterDepth)};
  float intensity = ignite - after;
  float waterY = ${glslFloat(LOOK.waterY)};
  vec3 col = vec3(0.015,0.010,0.013);
  float airMask = smoothstep(waterY - 0.02, waterY + 0.02, uv.y);

  // ---- AIR: the rising plume + emissive glow ----
  float heat = plumeHeat(uv, t, intensity);
  vec3 air = ember(heat);
  vec3 emHot = vec3(0.53,0.30,0.10);
  float glow = 0.0;
  glow += plumeHeat(uv+vec2( 0.035, 0.0  ), t, intensity);
  glow += plumeHeat(uv+vec2(-0.035, 0.0  ), t, intensity);
  glow += plumeHeat(uv+vec2( 0.0,   0.055), t, intensity);
  glow += plumeHeat(uv+vec2( 0.0,  -0.045), t, intensity);
  glow += plumeHeat(uv+vec2( 0.05,  0.06 ), t, intensity);
  glow += plumeHeat(uv+vec2(-0.05,  0.06 ), t, intensity);
  glow /= 6.0;
  air += emHot * pow(glow, 1.25) * 0.55 * ${glslFloat(LOOK.glow)};
  air += emHot * pow(max(heat-0.42, 0.0), 1.5) * ${glslFloat(LOOK.glow)};
  air *= ${glslFloat(LOOK.plumeGain)};

  // ---- WATER: fine-chop reflection + occasional concentric rings ----
  float depth = max(waterY - uv.y, 0.0);
  float rip = fbm(vec2(uv.x*5.0,       depth*${glslFloat(LOOK.ripFreq)} - t*0.55))
            + 0.5 * fbm(vec2(uv.x*11.0 + 3.0, depth*${glslFloat(LOOK.ripFreq)}*2.07 + t*0.30));
  rip *= 0.667;
  vec2  wp    = vec2(uv.x * (0.7 + depth*0.8), depth);
  float rings = waterRipples(wp, t) * ${glslFloat(LOOK.ring)};
  float crest = max(rings, 0.0);
  float disp  = ((rip - 0.5) + rings*3.0) * ${glslFloat(LOOK.disp)} * exp(-depth*0.45);
  vec2  refl  = vec2(uv.x + disp, 2.0*waterY - uv.y - abs(rings)*${glslFloat(LOOK.disp)}*0.5);
  float rheat = plumeHeat(refl, t, intensity);
  float shimmer = (1.0 - ${glslFloat(LOOK.shimmer)}) + ${glslFloat(LOOK.shimmer)} * rip;
  vec3  water = ember(rheat) * exp(-depth*${glslFloat(LOOK.reflReach)}) * shimmer;
  water += ember(rheat) * crest * 0.9;
  water += vec3(0.08,0.055,0.04) * crest * rheat * 1.8;
  float sparkle = smoothstep(0.80, 1.0, rip);
  water += vec3(0.08,0.055,0.04) * sparkle * rheat * exp(-depth*(${glslFloat(LOOK.reflReach)}+0.6)) * ${glslFloat(LOOK.sparkle)};

  // dormant sheen — dark but VISIBLE: before ignition a breath of light
  // catches the crests and the fine chop, then cedes to the reaction
  float dormantLight = (1.0 - ignite) * ${glslFloat(LOOK.dormant)};
  water += vec3(0.030,0.027,0.025) * crest * dormantLight * 2.6;
  water += vec3(0.013,0.012,0.012) * rip * dormantLight * exp(-depth*1.4);
  water += vec3(0.017,0.015,0.014) * exp(-depth*7.0) * dormantLight;

  col += mix(water, air, airMask);

  // deep filmic — hold the colour down, no white blowout — + vignette
  col = col / (col + vec3(1.15));
  col *= ${glslFloat(LOOK.exposure)};
  float vig = smoothstep(1.35, 0.25, length(uv));
  col *= mix(0.72, 1.0, vig);

  // grain kills banding
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.99,78.23))) * 43758.55 + t);
  col += (g-0.5)*0.02;

  gl_FragColor = vec4(col, 1.0);
}`;
