uniform sampler2D tDiffuse;
uniform sampler2D tBlurred;
uniform sampler2D tBake;
uniform sampler2D tNormal;
uniform vec3 baseColor;
uniform float reflectionStrength;
uniform float textureStrength;
varying vec4 vUv;
varying vec2 meshUV;

void main() {
    vec3 coord = vUv.xyz / vUv.w;
    vec3 normalColor = texture2D(tNormal, meshUV * 10.0).rgb;
    vec3 normal = normalize(vec3(normalColor.r * 2.0 - 1.0, normalColor.b, normalColor.g * 2.0 - 1.0));
    vec2 normalUv = coord.xy + coord.z * normal.xz * 0.065;
    vec3 bake = texture2D(tBake, meshUV).rgb;
    vec3 blurredReflection = texture2D(tBlurred, normalUv).rgb;
    vec3 reflection = blurredReflection * bake * reflectionStrength;
    float shade = 0.925 + bake.r * textureStrength + (normalColor.r - 0.5) * 0.018;
    vec3 color = baseColor * shade + reflection;
    gl_FragColor = vec4(color, 1.0);
}