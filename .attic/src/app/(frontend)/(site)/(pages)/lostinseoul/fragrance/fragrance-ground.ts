/**
 * Black mirror stage floor — the chapter's signature surface.
 * Each registered streak source (followspot beam, the passing sweep, the
 * reveal column) smears a stretched reflection toward the camera, broken up
 * by a subtle sheen mask, all scaled by the active beat's `wet` value.
 */

export const LOST_FRAGRANCE_STREAK_COUNT = 8;

export const LOST_FRAGRANCE_GROUND_VERTEX = /* glsl */ `
  varying vec3 vWorldPosition;
  #include <fog_pars_vertex>
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

export const LOST_FRAGRANCE_GROUND_FRAGMENT = /* glsl */ `
  uniform vec3 uBase;
  uniform float uWet;
  uniform vec3 uKeyPos;
  uniform vec3 uKeyColor;
  uniform float uKeyIntensity;
  uniform vec3 uStreakPos[${LOST_FRAGRANCE_STREAK_COUNT}];
  uniform vec3 uStreakColor[${LOST_FRAGRANCE_STREAK_COUNT}];
  uniform float uStreakIntensity[${LOST_FRAGRANCE_STREAK_COUNT}];
  varying vec3 vWorldPosition;
  #include <fog_pars_fragment>

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  void main() {
    vec2 ground = vWorldPosition.xz;

    // micro-variation so the plane never reads flat
    float grain = valueNoise(ground * 6.0);
    vec3 color = uBase * (0.85 + grain * 0.3);

    // sheen mask — broad patches of higher gloss; the dry floor stays
    // near-black so reflections read as events, not a floodlit field
    float puddle = smoothstep(0.38, 0.78, valueNoise(ground * 0.55));
    float gloss = uWet * mix(0.12, 1.0, puddle);

    // key-light pool — a localized wash of the beat's dominant color,
    // strongest in the sheen, never a floodlit floor
    vec2 keyDelta = ground - uKeyPos.xz;
    float keyDistSq = dot(keyDelta, keyDelta) + uKeyPos.y * uKeyPos.y;
    color += uKeyColor * (uKeyIntensity * 0.010 / (1.0 + keyDistSq * 0.08))
      * (0.25 + 0.75 * puddle) * (0.9 + grain * 0.2);

    vec3 streaks = vec3(0.0);
    for (int i = 0; i < ${LOST_FRAGRANCE_STREAK_COUNT}; i += 1) {
      float intensity = uStreakIntensity[i];
      if (intensity <= 0.001) continue;
      vec3 source = uStreakPos[i];
      float dx = ground.x - source.x;
      float dz = ground.y - source.z;
      // the smear runs from the source toward the camera (+z)
      float reach = source.y * 2.4 + 2.0;
      float along = clamp(dz / reach, 0.0, 1.0);
      float axial = dz >= 0.0
        ? pow(1.0 - along, 1.6)
        : exp(-6.0 * abs(dz));
      float width = mix(0.18, 1.4, along) + source.y * 0.05;
      float ripple = 0.75 + 0.25 * valueNoise(vec2(ground.x * 3.0, ground.y * 0.8));
      float lateral = exp(-(dx * dx) / (width * width));
      streaks += uStreakColor[i] * (intensity * axial * lateral * ripple);
    }

    color += streaks * gloss * 2.5;
    gl_FragColor = vec4(color, 1.0);
    #include <fog_fragment>
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
