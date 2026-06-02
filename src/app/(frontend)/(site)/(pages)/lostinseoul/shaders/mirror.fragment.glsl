uniform sampler2D tDiffuse;
uniform float mirror;
varying vec4 vUv;

void main() {
    vec2 uv = vUv.xy / vUv.w;
    vec4 reflectorColor = texture2D(tDiffuse, uv);
    gl_FragColor = vec4(reflectorColor.rgb * mirror, 1.0);
}