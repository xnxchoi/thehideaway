// Demimonde marble — fragment shader (frozen + lit + metallic veins)
//
// Pattern: domain-warped fractal Brownian motion (Quílez), TIME-FROZEN
// per the design call — the marble is a slab, not a slow river. Time is
// no longer fed into the warp.
//
// Lighting: analytical three-light setup that runs entirely in shader.
//   • Key   — warm, top-right, simulates afternoon sun coming over the
//             gate. Drives the main diffuse contribution.
//   • Fill  — cool, front-left, softens shadow side so the slab doesn't
//             go to black on its lit-away face.
//   • Amb   — broad warm wash so the unlit half stays in the family.
// Normal comes from the screen-space gradient of the same fBM that
// drives the pattern — finite-difference: sample the height field at
// (uv+eps,uv) and (uv,uv+eps), subtract, normalize. This is cheap
// (only forward differences) and gives veins/swells believable shading.
//
// Metallic veins: the same level-set band that produced "veining" before
// now drives a metalness factor (0..1). On vein crests, the surface
// switches to a chrome-warm reflection of an HDR envMap. Specular
// exponent sharpens with metalness — veins read as polished mineral
// streaks through the stone.
//
// EnvMap: equirectangular HDR (RGBE), passed as a regular sampler2D.
// We do the spherical-to-equirect math here ourselves rather than rely
// on Three's PMREM pipeline so the shader stays self-contained.

precision highp float;

varying vec2 vUv;

uniform vec2 u_cursor;           // canvas-local 0..1; (0.5,0.5) when no cursor
uniform vec2 u_resolution;       // canvas pixel size
uniform float u_intensity;       // 0..1; cursor bloom strength
uniform float u_scale;           // feature scale (≈3.0 = relaxed marble)
uniform sampler2D u_envMap;      // equirectangular HDR
uniform float u_envIntensity;    // 0..3 reflection strength
uniform sampler2D u_grainMap;    // paper-grain micro-texture (tileable)
uniform float u_grainTile;       // tile multiplier; ~6 reads as fine stone grain

// ─── palette ──────────────────────────────────────────────────────────
// Stone-realistic, low-saturation. The previous palette (cream-butter,
// sand-orange, terra-rust) read as amber resin because every stop sat
// inside the orange family at high chroma. Real warm marble — travertine,
// botticino, sandstone — is mostly desaturated with a hint of warmth.
// Even EMBER is shifted toward warm gray-brown, not red-brown.
const vec3 CREAM  = vec3(0.920, 0.890, 0.820);  // soft warm off-white
const vec3 SAND   = vec3(0.780, 0.720, 0.640);  // warm taupe
const vec3 TERRA  = vec3(0.560, 0.490, 0.420);  // pale warm gray-brown
const vec3 TOMATO = vec3(0.480, 0.380, 0.320);  // rust-leaning gray-brown
const vec3 EMBER  = vec3(0.260, 0.210, 0.180);  // deep warm earth

// Veins use a fixed dark color rather than multiplying stone — the
// multiplicative path saturated cream into orange-brown, killing the
// stone read.
const vec3 VEIN   = vec3(0.220, 0.180, 0.155);  // dark warm gray-brown

// ─── light setup ──────────────────────────────────────────────────────
const vec3 KEY_DIR  = vec3(0.4502, 0.6502, 0.6112);     // pre-normalized
const vec3 FILL_DIR = vec3(-0.4243, 0.2121, 0.8485);    // pre-normalized
// Lighting colors pulled toward neutral. The previous warm-yellow key
// against cool-blue fill amplified perceived saturation on the stone,
// making it look like polished honey. Stone reads more honestly with
// gentler color temperature spread.
const vec3 KEY_COLOR     = vec3(1.00, 0.96, 0.90);      // soft warm white
const vec3 FILL_COLOR    = vec3(0.88, 0.90, 0.94);      // soft cool white
const vec3 AMBIENT_COLOR = vec3(0.82, 0.80, 0.76);      // warm neutral
const float AMBIENT      = 0.50;
const float FILL_STR     = 0.35;
const vec3 METAL_TINT    = vec3(1.0, 0.92, 0.78);       // warm chrome (veins only)
const float PI = 3.14159265359;

// ─── noise utilities ──────────────────────────────────────────────────

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 6; i++) {
    v += a * noise(p);
    p *= 2.02;
    a *= 0.5;
  }
  return v;
}

// Marble height field — frozen, domain-warped twice, with a high-
// frequency detail pass that breaks up the smooth flow. Without the
// detail pass the surface reads as liquid paint marbling because
// domain-warped fBM by itself produces unrealistically clean curves.
// The detail term adds geological "fracturing" — small irregularities
// along vein contours that prevent the watercolor look.
float marbleHeight(vec2 uv) {
  float aspect = max(u_resolution.x, 1.0) / max(u_resolution.y, 1.0);
  vec2 p = uv * vec2(aspect, 1.0) * max(u_scale, 0.5);
  vec2 q = vec2(
    fbm(p),
    fbm(p + vec2(5.2, 1.3))
  );
  vec2 r = vec2(
    fbm(p + 4.0 * q + vec2(1.7, 9.2)),
    fbm(p + 4.0 * q + vec2(8.3, 2.8))
  );
  float base = fbm(p + 4.0 * r);

  // High-frequency detail (~6× macro scale, 8% amplitude). Just enough
  // to roughen the level-set contours so veins look fractured rather
  // than poured. Larger amplitude tips into "noise floor"; smaller is
  // imperceptible.
  float detail = fbm(p * 6.0) - 0.5;
  return base + detail * 0.08;
}

// Equirectangular environment sampling.
vec3 sampleEnv(vec3 dir) {
  vec2 envUv = vec2(
    atan(dir.x, dir.z) / (2.0 * PI) + 0.5,
    asin(clamp(dir.y, -1.0, 1.0)) / PI + 0.5
  );
  // Tone-map roughly — HDR can exceed 1.0; ACES-like soft clamp keeps
  // sample values predictable without crushing the sky.
  vec3 e = texture2D(u_envMap, envUv).rgb;
  return e / (e + vec3(1.0));
}

void main() {
  vec2 uv = vUv;

  // Discard pixels outside the inscribed circle so the marble shows as a
  // disc rather than a rectangle — the host turntable's button is
  // rounded-full, but the WebGL output lives in the global canvas
  // overlay (not inside the button's overflow-hidden), so the rounded
  // clip has to happen here in the shader instead.
  // Small smoothstep alpha edge avoids a hard aliased rim.
  vec2 fromCenter = uv - 0.5;
  float distFromCenter = length(fromCenter);
  if (distFromCenter > 0.5) discard;

  float aspect = max(u_resolution.x, 1.0) / max(u_resolution.y, 1.0);

  // Center height + forward differences for normal. eps is two pixels in
  // texel-space so the gradient picks up actual variation, not aliasing.
  float eps = 2.0 / max(u_resolution.x, 380.0);
  float h   = marbleHeight(uv);
  float h_x = marbleHeight(uv + vec2(eps, 0.0));
  float h_y = marbleHeight(uv + vec2(0.0, eps));

  // Strength constant trades bumpiness vs realism. Polished marble is
  // nearly flat — the figure shows through pattern, not topology. 3.5
  // gives just enough lighting variation to feel three-dimensional
  // without devolving into hammered-foil facets.
  vec3 normal = normalize(vec3((h - h_x) * 3.5, (h - h_y) * 3.5, 1.0));

  // Vein mask: sharper level-set crease. Previous (0.017 each side)
  // feathered too much — paint bleeds, stone fractures. Tightening the
  // upper edge especially gives the outer vein boundary a crisp rocky
  // line. Inner edge keeps a small feather so the vein still has a
  // soft "core → edge" gradient rather than reading as flat ink.
  float vein = smoothstep(0.470, 0.482, h) - smoothstep(0.482, 0.488, h);
  float metalness = vein;

  // Capillary veins — thin secondary cracks at a different level set.
  // ~1.5% area, much sharper edges, no metalness contribution. These
  // are the hairline fractures that turn "marbled paper" into "carved
  // stone." Added directly to the stone tinting later, not metallic.
  float capillary =
    smoothstep(0.520, 0.524, h) - smoothstep(0.524, 0.528, h);

  // ─── base stone palette ─────────────────────────────────────────────
  // Cream dominates. SAND and TERRA only appear in narrow windows;
  // TOMATO/EMBER are reserved for the deepest peaks of the noise so
  // they read as accents inside the stone, not as the surface itself.
  vec3 stone = mix(SAND, CREAM, smoothstep(0.30, 0.48, h));
  stone = mix(stone, SAND, smoothstep(0.62, 0.78, h) * 0.55);
  stone = mix(stone, TERRA, smoothstep(0.84, 0.96, h) * 0.45);
  stone = mix(stone, EMBER, smoothstep(0.95, 1.00, h) * 0.3);

  // Vein tonal variation — sample a secondary noise field to perturb
  // the vein color along its length. Some patches darker (richer
  // pigment), some lighter (washed-out areas). Without this the vein
  // reads as a uniform painted stroke; with it, as natural mineral
  // deposit. Range maps to ±0.4 around the base VEIN brightness.
  float veinTone = fbm(uv * 8.0 + h * 3.0);
  vec3 veinShade = VEIN * mix(0.6, 1.3, veinTone);
  stone = mix(stone, veinShade, vein * 0.88);

  // Capillary cracks — thinner, sharper, slightly lighter than main
  // veins. Multiplicative so they read as desaturation, not paint.
  stone = mix(stone, VEIN * 1.35, capillary * 0.55);

  // ─── micro-grain (high-frequency stone texture) ─────────────────────
  // Real paper-fiber sample (papier.png) instead of procedural noise.
  // The hand-scanned grain has organic clustering and luminance variation
  // that procedural value-noise can't fake — gives the surface a "cut
  // stone" feel rather than the previous "poured resin" smoothness.
  // Multiplicative perturbation on stone only; veins stay polished.
  float grain = texture2D(u_grainMap, uv * u_grainTile).r - 0.5;
  stone *= 1.0 + grain * 0.18 * (1.0 - metalness);

  // ─── analytical 3-light lambert ─────────────────────────────────────
  float diffKey  = max(dot(normal, KEY_DIR), 0.0);
  float diffFill = max(dot(normal, FILL_DIR), 0.0) * FILL_STR;
  vec3 lit = stone * (
    AMBIENT_COLOR * AMBIENT +
    KEY_COLOR     * diffKey +
    FILL_COLOR    * diffFill
  );

  // ─── env-map reflection on veins (metallic path) ───────────────────
  // The reflection itself is direction-only; without gating it would
  // show on the shadow side too. Real metallic streaks only "shine"
  // where light reaches them — so we attenuate the metallic path by
  // how much direct light is hitting this pixel. Shadow-side veins
  // fall back to plain dark stone instead of a free-floating mirror.
  //
  // `litness` mixes the key light (dominant) with a fraction of fill;
  // no ambient floor — shadow-side veins fall fully to matte stone.
  float litness = clamp(diffKey + diffFill * 0.5, 0.0, 1.0);
  // Smooth the transition so the lit/shadow boundary doesn't band.
  litness = smoothstep(0.0, 0.55, litness);

  vec3 viewDir = vec3(0.0, 0.0, 1.0);
  vec3 reflectDir = reflect(-viewDir, normal);
  vec3 envColor = sampleEnv(reflectDir);
  vec3 metalColor = envColor * METAL_TINT * u_envIntensity;

  // Effective metalness: vein crests are full metal where lit, drift
  // toward stone where shadowed.
  float effectiveMetalness = metalness * litness;

  // Blinn-Phong specular: vein-only. Stone is matte by design — full
  // zero on metalness=0 so the surface reads as honest polished stone
  // with mineral streaks, not waxed plastic. Naturally gated by the
  // half-vector dot for the lit-side restriction.
  vec3 halfDir = normalize(KEY_DIR + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 180.0) * metalness * 0.95;

  // Compose: lit (matte) stone vs metallic env (light-gated), then
  // vein-only specular highlight on top.
  vec3 col = mix(lit, metalColor, effectiveMetalness);
  col += spec * KEY_COLOR;

  // ─── cursor bloom (atmospheric, not load-bearing) ──────────────────
  vec2 cursorDelta = (uv - u_cursor) * vec2(aspect, 1.0);
  float d = length(cursorDelta);
  float highlight = smoothstep(0.7, 0.0, d);
  col += highlight * vec3(0.34, 0.26, 0.16) * u_intensity * 0.55;

  // ─── rim vignette ──────────────────────────────────────────────────
  vec2 ce = uv - 0.5;
  float vignette = smoothstep(0.78, 0.42, length(ce));
  col *= mix(0.84, 1.0, vignette);

  gl_FragColor = vec4(col, 1.0);
}
