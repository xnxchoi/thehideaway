import {
  Camera,
  ClampToEdgeWrapping,
  Color,
  DataTexture,
  FloatType,
  Mesh,
  MeshBasicMaterial,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";

const renderer = new WebGLRenderer({
  antialias: !1,
  alpha: !0,
  depth: !1,
  stencil: !0,
  powerPreference: "high-performance"
});
renderer.setPixelRatio(config.webgl.pixelRatio);
const resize$2 = () => {
  const Wr = window.innerWidth,
    ze = window.innerHeight;
  renderer.setSize(Wr, ze);
};
window.addEventListener("resize", resize$2);
resize$2();
const container = document.querySelector(".webgl"),
  canvas$1 = renderer.domElement;
container.appendChild(canvas$1);
const scene = new Scene();
scene.background = new Color(16777215);
const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
camera.position.z = 1;
class GPUComputationRenderer {
  constructor(ze, Gr, Yr) {
    ((this.variables = []), (this.currentTextureIndex = 0));
    let Kr = FloatType;
    const Zr = new Scene(),
      Jr = new Camera();
    Jr.position.z = 1;
    const Qr = {
        passThruTexture: {
          value: null
        }
      },
      ei = ni(si(), Qr),
      ti = new Mesh(new PlaneGeometry(2, 2), ei);
    (Zr.add(ti),
      (this.setDataType = function (oi) {
        return ((Kr = oi), this);
      }),
      (this.addVariable = function (oi, li, ui) {
        const ai = this.createShaderMaterial(li),
          fi = {
            name: oi,
            initialValueTexture: ui,
            material: ai,
            dependencies: null,
            renderTargets: [],
            wrapS: null,
            wrapT: null,
            minFilter: NearestFilter,
            magFilter: NearestFilter
          };
        return (this.variables.push(fi), fi);
      }),
      (this.setVariableDependencies = function (oi, li) {
        oi.dependencies = li;
      }),
      (this.init = function () {
        if (
          Yr.capabilities.isWebGL2 === !1 &&
          Yr.extensions.has("OES_texture_float") === !1
        )
          return "No OES_texture_float support for float textures.";
        if (Yr.capabilities.maxVertexTextures === 0)
          return "No support for vertex shader textures.";
        for (let oi = 0; oi < this.variables.length; oi++) {
          const li = this.variables[oi];
          ((li.renderTargets[0] = this.createRenderTarget(
            ze,
            Gr,
            li.wrapS,
            li.wrapT,
            li.minFilter,
            li.magFilter
          )),
            (li.renderTargets[1] = this.createRenderTarget(
              ze,
              Gr,
              li.wrapS,
              li.wrapT,
              li.minFilter,
              li.magFilter
            )),
            this.renderTexture(li.initialValueTexture, li.renderTargets[0]),
            this.renderTexture(li.initialValueTexture, li.renderTargets[1]));
          const ui = li.material,
            ai = ui.uniforms;
          if (li.dependencies !== null)
            for (let fi = 0; fi < li.dependencies.length; fi++) {
              const ci = li.dependencies[fi];
              if (ci.name !== li.name) {
                let hi = !1;
                for (let di = 0; di < this.variables.length; di++)
                  if (ci.name === this.variables[di].name) {
                    hi = !0;
                    break;
                  }
                if (!hi)
                  return (
                    "Variable dependency not found. Variable=" +
                    li.name +
                    ", dependency=" +
                    ci.name
                  );
              }
              ((ai[ci.name] = {
                value: null
              }),
                (ui.fragmentShader =
                  `
uniform sampler2D ` +
                  ci.name +
                  `;
` +
                  ui.fragmentShader));
            }
        }
        return ((this.currentTextureIndex = 0), null);
      }),
      (this.compute = function () {
        const oi = this.currentTextureIndex,
          li = this.currentTextureIndex === 0 ? 1 : 0;
        for (let ui = 0, ai = this.variables.length; ui < ai; ui++) {
          const fi = this.variables[ui];
          if (fi.dependencies !== null) {
            const ci = fi.material.uniforms;
            for (let hi = 0, di = fi.dependencies.length; hi < di; hi++) {
              const pi = fi.dependencies[hi];
              ci[pi.name].value = pi.renderTargets[oi].texture;
            }
          }
          this.doRenderTarget(fi.material, fi.renderTargets[li]);
        }
        this.currentTextureIndex = li;
      }),
      (this.getCurrentRenderTarget = function (oi) {
        return oi.renderTargets[this.currentTextureIndex];
      }),
      (this.getAlternateRenderTarget = function (oi) {
        return oi.renderTargets[this.currentTextureIndex === 0 ? 1 : 0];
      }),
      (this.dispose = function () {
        (ti.geometry.dispose(), ti.material.dispose());
        const oi = this.variables;
        for (let li = 0; li < oi.length; li++) {
          const ui = oi[li];
          ui.initialValueTexture && ui.initialValueTexture.dispose();
          const ai = ui.renderTargets;
          for (let fi = 0; fi < ai.length; fi++) ai[fi].dispose();
        }
      }));
    function ri(oi) {
      oi.defines.resolution =
        "vec2( " + ze.toFixed(1) + ", " + Gr.toFixed(1) + " )";
    }
    this.addResolutionDefine = ri;
    function ni(oi, li) {
      li = li || {};
      const ui = new ShaderMaterial({
        name: "GPUComputationShader",
        uniforms: li,
        vertexShader: ii(),
        fragmentShader: oi
      });
      return (ri(ui), ui);
    }
    ((this.createShaderMaterial = ni),
      (this.createRenderTarget = function (oi, li, ui, ai, fi, ci) {
        return (
          (oi = oi || ze),
          (li = li || Gr),
          (ui = ui || ClampToEdgeWrapping),
          (ai = ai || ClampToEdgeWrapping),
          (fi = fi || NearestFilter),
          (ci = ci || NearestFilter),
          new WebGLRenderTarget(oi, li, {
            wrapS: ui,
            wrapT: ai,
            minFilter: fi,
            magFilter: ci,
            format: RGBAFormat,
            type: Kr,
            depthBuffer: !1
          })
        );
      }),
      (this.createTexture = function () {
        const oi = new Float32Array(ze * Gr * 4),
          li = new DataTexture(oi, ze, Gr, RGBAFormat, FloatType);
        return ((li.needsUpdate = !0), li);
      }),
      (this.renderTexture = function (oi, li) {
        ((Qr.passThruTexture.value = oi),
          this.doRenderTarget(ei, li),
          (Qr.passThruTexture.value = null));
      }),
      (this.doRenderTarget = function (oi, li) {
        const ui = Yr.getRenderTarget(),
          ai = Yr.xr.enabled,
          fi = Yr.shadowMap.autoUpdate;
        ((Yr.xr.enabled = !1),
          (Yr.shadowMap.autoUpdate = !1),
          (ti.material = oi),
          Yr.setRenderTarget(li),
          Yr.render(Zr, Jr),
          (ti.material = ei),
          (Yr.xr.enabled = ai),
          (Yr.shadowMap.autoUpdate = fi),
          Yr.setRenderTarget(ui));
      }));
    function ii() {
      return `void main()	{

	gl_Position = vec4( position, 1.0 );

}
`;
    }
    function si() {
      return `uniform sampler2D passThruTexture;

void main() {

	vec2 uv = gl_FragCoord.xy / resolution.xy;

	gl_FragColor = texture2D( passThruTexture, uv );

}
`;
    }
  }
}
class GPGPU {
  constructor(ze, Gr, Yr = ze) {
    ((this.textures = {}),
      (this.variables = []),
      (this.gpuComputer = new GPUComputationRenderer(ze, Yr, Gr)));
  }
  createTexture(ze, Gr = 8) {
    return (
      (this.textures[ze] = this.gpuComputer.createTexture()),
      this._createIndexes(Gr, this.textures[ze]),
      this.textures[ze]
    );
  }
  _createIndexes(ze, Gr) {
    const Yr = ze * ze;
    Gr.indexes = new Float32Array(Yr * 2);
    for (let Kr = 0; Kr < Yr; Kr++)
      ((Gr.indexes[Kr * 2 + 0] = (Kr % ze) / ze),
        (Gr.indexes[Kr * 2 + 1] = ~~(Kr / ze) / ze));
  }
  addVariable(ze, Gr, Yr, Kr) {
    const Zr = this.gpuComputer.addVariable(ze, Yr, Gr);
    if ((this.gpuComputer.setVariableDependencies(Zr, [Zr]), Kr))
      for (const Qr in Kr)
        Zr.material.uniforms[Qr] = {
          value: Kr[Qr]
        };
    const Jr = this.gpuComputer.init();
    (Jr !== null && console.error(Jr), (this.variables[ze] = Zr));
  }
  addDebugPlane(ze, Gr) {
    let Yr = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({
        map: this.gpuComputer.getCurrentRenderTarget(this.variables[Gr]).texture
      })
    );
    (ze.add(Yr),
      gsapWithCSS.ticker.add(() => {
        ((Yr.material.map = this.gpuComputer.getCurrentRenderTarget(
          this.variables[Gr]
        ).texture),
          (Yr.material.needsUpdate = !0));
      }));
  }
}

const simulationFragShader = `
// The size of the computation (sizeX * sizeY) is defined as 'resolution' automatically in the shader.
// For example:
// #DEFINE resolution vec2( 1024.0, 1024.0 )

uniform vec2 uMouse;
uniform vec2 uPrevMouse;
uniform float uTime;
uniform float uDelta;
uniform float uMouseFactor;

// Function to calculate the minimum distance from a point to a line segment
float distanceToSegment(vec2 point, vec2 start, vec2 end) {
    vec2 lineVec = end - start;
    vec2 pointVec = point - start;
    float lineLen = length(lineVec);
    vec2 lineUnitVec = lineVec / lineLen;
    float projLength = dot(pointVec, lineUnitVec);
    projLength = clamp(projLength, 0.0, lineLen);
    vec2 projPoint = start + lineUnitVec * projLength;
    return length(point - projPoint);
}

void main()
{
    vec2 uv = gl_FragCoord.xy / resolution.xy;

    vec4 data = texture2D(tPosition, uv);

    // blacken over time
    data.r = mix(data.r, .5, uDelta * .002);
    data.g = mix(data.g, .5, uDelta * .002);
    data.b = mix(data.b, 0., uDelta * .001);

    float dist = distance(uMouse, uPrevMouse);
    dist *= 1. - step(.2, dist); // avoid big straight lines when entering the canvas

    //float aspect = min(resolution.x, resolution.y) / max(resolution.x, resolution.y);
    //float mixer = smoothstep(.65, .85, aspect);
    //float aspectCorrection = mix(1., 1., mixer);
    vec2 direction = normalize(uMouse - uPrevMouse);// * aspectCorrection;

    //direction = vec2(10., 10.);
    //float angle = atan(direction.y, direction.x);
    //float hue = degrees(angle);

    // Normalize hue from -180 to 180 to 0 to 1
    //hue = mod((hue / 360.0) + 1.0, 1.0);

    // Calculate the distance to the line segment from last mouse position to current
    float distanceToLine = distanceToSegment(uv, uPrevMouse, uMouse);

    float lineInfluence = 1. - smoothstep(0., .2, distanceToLine);
    lineInfluence = clamp(lineInfluence, 0., 1.);
    lineInfluence = pow(lineInfluence, .5);

    float velocityFactor = dist * 1.;
    float influence = lineInfluence * velocityFactor * uMouseFactor;
    data.r += direction.x * 2. * influence;
    data.g += direction.y * 2. * influence;
    data.b += influence;

    data.r = clamp(data.r, 0., 1.);
    data.g = clamp(data.g, 0., 1.);
    data.b = clamp(data.b, 0., 1.);

    gl_FragColor = data;
}
`,
  mouse = new Vector2(),
  mouseUv = new Vector2(),
  prevMouseUv = new Vector2();
window.addEventListener("pointermove", (Wr) => {
  ((mouse.x = Wr.clientX),
    (mouse.y = Wr.clientY),
    prevMouseUv.copy(mouseUv),
    (mouseUv.x = mouse.x / (canvas$1.width / config.webgl.pixelRatio)),
    (mouseUv.y = 1 - mouse.y / (canvas$1.height / config.webgl.pixelRatio)));
});
const uLerpedMouseUv = new Uniform(new Vector2());
gsapWithCSS.ticker.add((Wr, ze) => {
  uLerpedMouseUv.value.lerp(mouseUv, ze / 150);
});
let mouseFactorTimeout;
const uMouseFactor = new Uniform(0),
  listenMouseMove = (Wr) => {
    Wr.target.getAttribute("no-webgl-hover") === null &&
      ((uMouseFactor.value = 1),
      mouseFactorTimeout && clearTimeout(mouseFactorTimeout),
      (mouseFactorTimeout = setTimeout(() => {
        gsapWithCSS.to(uMouseFactor, {
          value: 0,
          duration: 0.1,
          ease: "none"
        });
      }, 50)));
  };
window.addEventListener("mousemove", listenMouseMove);
const uResolution = new Uniform(
    new Vector2(canvas$1.offsetWidth, canvas$1.offsetHeight)
  ),
  resize$1 = () =>
    uResolution.value.set(canvas$1.offsetWidth, canvas$1.offsetHeight);
window.addEventListener("resize", resize$1);
const uScrollOffset = new Uniform(0);
lenis$1.on("scroll", (Wr) => {
  uScrollOffset.value += Wr.velocity * 3e-4;
});
let ww = document.documentElement.clientWidth,
  wh = window.innerHeight,
  w = Math.floor(ww / 40),
  h$1 = Math.floor(wh / 40),
  gpgpu;
const uSimulationTexture = new Uniform();
createGPGPU(w, h$1);
gsapWithCSS.ticker.add((Wr, ze) => {
  gpgpu &&
    ((gpgpu.variables.tPosition.material.uniforms.uTime.value = Wr),
    (gpgpu.variables.tPosition.material.uniforms.uDelta.value = ze),
    (gpgpu.variables.tPosition.material.uniforms.uMouseFactor.value =
      uMouseFactor.value),
    gpgpu.gpuComputer.compute());
});
window.addEventListener("resize", () => {
  (gpgpu &&
    (gpgpu.gpuComputer.dispose(), (gpgpu.gpuComputer = null), (gpgpu = null)),
    (ww = document.documentElement.clientWidth),
    (wh = window.innerHeight),
    (w = Math.floor(ww / 40)),
    (h$1 = Math.floor(wh / 40)),
    createGPGPU(w, h$1));
});
function createGPGPU(Wr, ze) {
  ((gpgpu = new GPGPU(Wr, renderer, ze)),
    gpgpu.addVariable("tPosition", null, simulationFragShader, {
      uMouse: mouseUv,
      uPrevMouse: prevMouseUv,
      uTime: 0,
      uDelta: 0,
      uMouseFactor
    }),
    (uSimulationTexture.value = gpgpu.gpuComputer.getCurrentRenderTarget(
      gpgpu.variables.tPosition
    ).texture));
}
const noiseImageUrl = "/dist/assets/3seamless-7f29af5e.png",
  uTime = new Uniform(0),
  uSize = new Uniform(0.2),
  uOffset = new Uniform(new Vector2(0.42, 0.6)),
  uSpeed = new Uniform(0.02),
  uColor1 = new Uniform(new Color("rgb(65,66,73)")),
  uColor2 = new Uniform(new Color("rgb(36,39,51)")),
  uColor3 = new Uniform(new Color("rgb(49,103,160)")),
  uColor4 = new Uniform(new Color("rgb(117,153,245)")),
  noiseTexture = new TextureLoader().load(noiseImageUrl);
noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping;
const uNoiseTexture = new Uniform(noiseTexture),
  uColorMixer = new Uniform(0),
  uMenuMode = new Uniform(0),
  uAdditionalZoom = new Uniform(0),
  uAdditionalOffset = new Uniform(new Vector2(0, 0));
gsapWithCSS.ticker.add((Wr) => (uTime.value = Wr));
let gui$1;
const debug$1 = {
    mount: () => {
      gui$1 ||
        ((gui$1 = new GUI({
          name: "gradient",
          closed: !0
        })),
        gui$1.slider({
          name: "size",
          obj: uSize,
          prop: "value",
          max: 2
        }),
        gui$1.vector2({
          name: "Position",
          x: {
            obj: uOffset.value,
            prop: "x",
            min: uOffset.value.x - 2,
            max: uOffset.value.x + 2
          },
          y: {
            obj: uOffset.value,
            prop: "y",
            min: uOffset.value.y - 2,
            max: uOffset.value.y + 2
          }
        }),
        gui$1.slider({
          name: "speed",
          obj: uSpeed,
          prop: "value",
          min: 0,
          max: 0.1
        }),
        gui$1.color(
          {
            name: "color1",
            value: "#" + uColor1.value.getHexString()
          },
          (Wr) => {
            uColor1.value.set(Wr);
          }
        ),
        gui$1.color(
          {
            name: "color2",
            value: "#" + uColor2.value.getHexString()
          },
          (Wr) => {
            uColor2.value.set(Wr);
          }
        ),
        gui$1.color(
          {
            name: "color3",
            value: "#" + uColor3.value.getHexString()
          },
          (Wr) => {
            uColor3.value.set(Wr);
          }
        ),
        gui$1.color(
          {
            name: "color4",
            value: "#" + uColor4.value.getHexString()
          },
          (Wr) => {
            uColor4.value.set(Wr);
          }
        ),
        gui$1.slider({
          name: "uColorMixer",
          obj: uColorMixer,
          prop: "value"
        }));
    },
    unmount: () => {
      (gui$1 && gui$1.kill(), (gui$1 = void 0));
    }
  },
  material = new ShaderMaterial({
    vertexShader: `
    varying vec2 vUv;

    void main() {
      gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      vUv = uv;
    }`,
    fragmentShader: `
    varying vec2 vUv;

    uniform float uTime;
    uniform vec3 uColor1;
    uniform vec3 uColor2;
    uniform vec3 uColor3;
    uniform vec3 uColor4;
    uniform float uSize;
    uniform vec2 uOffset;
    uniform float uSpeed;
    uniform sampler2D uNoiseTexture;
    uniform sampler2D uSimulationTexture;
    uniform vec2 uResolution;
    uniform float uColorMixer;
    uniform float uMenuMode;
    uniform float uAdditionalZoom;
    uniform vec2 uAdditionalOffset;
    uniform float uScrollOffset;

    void main() {
        vec2 nUv = (-.5 + vUv) * 2.;
        if( uResolution.x < uResolution.y ) {
            nUv.x *= uResolution.x / uResolution.y;
        } else {
            nUv.y *= uResolution.y / uResolution.x;
        }
        nUv = nUv / 2. + .5;

        float additionalZoom = uAdditionalZoom * (1. - uMenuMode);
        vec2 offset = uOffset + uAdditionalOffset * (1. - uMenuMode);
        offset.y -= uScrollOffset;

        vec2 bUv = nUv * (uSize * 2. + additionalZoom) + offset * uMenuMode; // dUv
        vec2 nUv1 = bUv + offset * (1. - uMenuMode) + uTime * uSpeed;
        bUv.y -= .5;
        vec2 nUv2 = bUv + offset * (1. - uMenuMode) - uTime * uSpeed;

        vec4 noiseColor1 = texture2D(uNoiseTexture, nUv1);
        float noise1 = noiseColor1.r;

        vec4 noiseColor2 = texture2D(uNoiseTexture, nUv2);
        float noise2 = noiseColor2.r;

        //float noise = clamp(noise1 * .5 + noise2 * .5, 0., 1.);
        float noise = clamp((noise1 + noise2) / 2., 0., 1.);

        vec2 nUv3 = bUv + noise * .5;
        noise = texture2D(uNoiseTexture, nUv3).r;


        // coloring
        vec3 color = vec3(0.);
        noise = mix(noise, noise * 1.25 + .15, uMenuMode);
        if (noise < 0.25) {
            color = mix(uColor1, uColor2, noise / 0.25);
        } else if (noise < 0.5) {
            color = mix(uColor2, uColor3, (noise - 0.25) / 0.25);
        } else if (noise < 0.75) {
            color = mix(uColor3, uColor4, (noise - 0.5) / 0.25);
        } else {
            color = uColor4;
        }

        //color = step(.5, color);

        //color = mix(color, pow(color, vec3(2.)), uColorMixer);
        vec3 alt = pow(color, vec3(2.));
        alt = alt * 1. - step(.01, color);
        color = mix(color, alt, uColorMixer);

        gl_FragColor = vec4(color, 1.);
        //gl_FragColor = gpgpuColor;

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }`,
    uniforms: {
      uMouse: uLerpedMouseUv,
      uTime,
      uColor1,
      uColor2,
      uColor3,
      uColor4,
      uSize,
      uOffset,
      uSpeed,
      uNoiseTexture,
      uSimulationTexture,
      uResolution,
      uColorMixer,
      uMenuMode,
      uAdditionalZoom,
      uAdditionalOffset,
      uScrollOffset
    }
  });
/**
 * postprocessing v6.35.4 build Fri Apr 26 2024
 * https://github.com/pmndrs/postprocessing
 * Copyright 2015-2024 Raoul van Rüschen
 * @license Zlib
 */
var MILLISECONDS_TO_SECONDS = 1 / 1e3,
  SECONDS_TO_MILLISECONDS = 1e3,
  Timer = class {
    constructor() {
      ((this.startTime = performance.now()),
        (this.previousTime = 0),
        (this.currentTime = 0),
        (this._delta = 0),
        (this._elapsed = 0),
        (this._fixedDelta = 1e3 / 60),
        (this.timescale = 1),
        (this.useFixedDelta = !1),
        (this._autoReset = !1));
    }
    get autoReset() {
      return this._autoReset;
    }
    set autoReset(Wr) {
      typeof document < "u" &&
        document.hidden !== void 0 &&
        (Wr
          ? document.addEventListener("visibilitychange", this)
          : document.removeEventListener("visibilitychange", this),
        (this._autoReset = Wr));
    }
    get delta() {
      return this._delta * MILLISECONDS_TO_SECONDS;
    }
    get fixedDelta() {
      return this._fixedDelta * MILLISECONDS_TO_SECONDS;
    }
    set fixedDelta(Wr) {
      this._fixedDelta = Wr * SECONDS_TO_MILLISECONDS;
    }
    get elapsed() {
      return this._elapsed * MILLISECONDS_TO_SECONDS;
    }
    update(Wr) {
      (this.useFixedDelta
        ? (this._delta = this.fixedDelta)
        : ((this.previousTime = this.currentTime),
          (this.currentTime =
            (Wr !== void 0 ? Wr : performance.now()) - this.startTime),
          (this._delta = this.currentTime - this.previousTime)),
        (this._delta *= this.timescale),
        (this._elapsed += this._delta));
    }
    reset() {
      ((this._delta = 0),
        (this._elapsed = 0),
        (this.currentTime = performance.now() - this.startTime));
    }
    getDelta() {
      return this.delta;
    }
    getElapsed() {
      return this.elapsed;
    }
    handleEvent(Wr) {
      document.hidden ||
        (this.currentTime = performance.now() - this.startTime);
    }
    dispose() {
      this.autoReset = !1;
    }
  },
  dummyCamera = new Camera(),
  geometry = null;
function getFullscreenTriangle() {
  if (geometry === null) {
    const Wr = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]),
      ze = new Float32Array([0, 0, 2, 0, 0, 2]);
    ((geometry = new BufferGeometry()),
      geometry.setAttribute !== void 0
        ? (geometry.setAttribute("position", new BufferAttribute(Wr, 3)),
          geometry.setAttribute("uv", new BufferAttribute(ze, 2)))
        : (geometry.addAttribute("position", new BufferAttribute(Wr, 3)),
          geometry.addAttribute("uv", new BufferAttribute(ze, 2))));
  }
  return geometry;
}
const grain = `uniform float uXCount;
uniform float uYCount;
uniform float uIntensity;

vec2 hash(vec2 p) // replace this by something better
{
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(in vec2 p) {
  const float K1 = 0.366025404; // (sqrt(3)-1)/2;
  const float K2 = 0.211324865; // (3-sqrt(3))/6;

  vec2 i = floor(p + (p.x + p.y) * K1);
  vec2 a = p - i + (i.x + i.y) * K2;
  float m = step(a.y, a.x);
  vec2 o = vec2(m, 1.0 - m);
  vec2 b = a - o + K2;
  vec2 c = a - 1.0 + 2.0 * K2;
  vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
  vec3 n =
      h * h * h * h *
      vec3(dot(a, hash(i + 0.0)), dot(b, hash(i + o)), dot(c, hash(i + 1.0)));
  return dot(n, vec3(70.0));
}

float speed = 12.;
// float intensity = .01;

float random2d(vec2 coord) {
  return fract(sin(dot(coord.xy, vec2(12.9898, 78.233))) * 43758.5453);
}

float blendSoftLight(float base, float blend) {
  return (blend < 0.5)
             ? (2.0 * base * blend + base * base * (1.0 - 2.0 * blend))
             : (sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return vec3(blendSoftLight(base.r, blend.r), blendSoftLight(base.g, blend.g),
              blendSoftLight(base.b, blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
  return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

void mainImage(const in vec4 inputColor, const in vec2 uv,
               out vec4 outputColor) {
  float gridX = floor(uv.x * uXCount) / uXCount;
  float gridY = 1.0 - floor(uv.y * uYCount) / uYCount;
  float t = mod(time, 1.);
  // float timeSpeed = time; // -> fluide (it's random, so we cant control the
  // speed)
  float timeSpeed = floor(t * 8.); // -> saccadé
  // float timeSpeed = 1.;
  // float intensity = (inputColor.r + inputColor.g + inputColor.b) / 3.;
  float grain = random2d(vec2(gridX + timeSpeed, gridY));

  grain -= grain / 2.;
  grain *= .1;

  vec3 resultColor =
      blendSoftLight(inputColor.rgb, inputColor.rgb + grain, uIntensity);

  outputColor = vec4(resultColor, 1.0);
  // outputColor = vec4(inputColor.rgb, 1.0);
}
`,
  pixelSize = window.devicePixelRatio,
  uXCount = new Uniform(canvas$1.offsetWidth / pixelSize),
  uYCount = new Uniform(canvas$1.offsetHeight / pixelSize),
  uIntensity = new Uniform(1.29),
  renderPass = new RenderPass(scene, camera),
  grainEffect = new Effect("grain", grain, {
    blendFunction: BlendFunction.NORMAL,
    uniforms: new Map([
      ["uXCount", uXCount],
      ["uYCount", uYCount],
      ["uIntensity", uIntensity]
    ])
  }),
  blurPass = new KawaseBlurPass();
blurPass.scale = 2;
const displacementEffect = new Effect(
    "displacement",
    `
    uniform sampler2D uSimulationTexture;
    uniform vec2 uDisplacementStrength;
    uniform float uCursorColoring;

    void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        // UV aspect fix
        /* vec2 nUv = (-.5 + uv) * 2.;
        if( resolution.x < resolution.y ) {
            nUv.x *= resolution.x / resolution.y;
        } else {
            nUv.y *= resolution.y / resolution.x;
        }
        nUv = nUv / 2. + .5; */

        vec4 gpgpuColor = texture2D(uSimulationTexture, vUv);

        vec2 dUv = vec2(
            uv.x - (-0.5 + gpgpuColor.r) * uDisplacementStrength.x * gpgpuColor.b,
            uv.y - (-0.5 + gpgpuColor.g) * uDisplacementStrength.y * gpgpuColor.b
        );

        vec4 color = texture2D(inputBuffer, dUv);

        color.rgb += color.rgb * gpgpuColor.b * uCursorColoring;

        outputColor = vec4(color.rgb, 1.0);
    }`,
    {
      blendFunction: BlendFunction.NORMAL,
      uniforms: new Map([
        ["uSimulationTexture", uSimulationTexture],
        ["uDisplacementStrength", new Uniform(new Vector2(2, 2))],
        ["uCursorColoring", new Uniform(1.5)]
      ])
    }
  ),
  effectPass = new EffectPass(camera, displacementEffect, grainEffect),
  passes = [renderPass, blurPass, effectPass];
let background;
class PresetManager {
  static registerChange() {
    (background || (background = canvasManager.getEffect("gradient")),
      this.current && (this.previous = this.current));
  }
  static set(ze) {
    switch (ze) {
      case "menu":
        this.menu();
        break;
      case "culture":
        this.culture();
        break;
      default:
        this.normal();
    }
  }
  static normal(ze = !1) {
    if ((this.registerChange(), (this.current = "normal"), !ze))
      (background.setSize(0.2),
        background.setGrainIntensity(1.29),
        background.setColor1("rgb(65,66,73)"),
        background.setColor2("rgb(36,39,51)"),
        background.setColor3("rgb(49,103,160)"),
        background.setColor4("rgb(117,153,245)"),
        (blurPass.scale = 2),
        (uColorMixer.value = 0),
        (uMenuMode.value = 0));
    else {
      const Gr = gsapWithCSS.timeline({
        defaults: {
          ease: "power2.inOut",
          duration: 1
        }
      });
      (Gr.to(
        uSize,
        {
          value: 0.2
        },
        0
      ),
        Gr.to(
          uIntensity,
          {
            value: 1.29
          },
          0
        ),
        Gr.to(
          uColor1.value,
          {
            r: 0.05286064,
            g: 0.05448027,
            b: 0.06662593
          },
          0
        ),
        Gr.to(
          uColor2.value,
          {
            r: 0.01764195,
            g: 0.02028856,
            b: 0.03310476
          },
          0
        ),
        Gr.to(
          uColor3.value,
          {
            r: 0.03071344,
            g: 0.13563332,
            b: 0.35153259
          },
          0
        ),
        Gr.to(
          uColor4.value,
          {
            r: 0.17788841,
            g: 0.31854677,
            b: 0.91309865
          },
          0
        ),
        Gr.to(
          blurPass,
          {
            scale: 2
          },
          0
        ),
        Gr.to(
          uColorMixer,
          {
            value: 0
          },
          0
        ),
        Gr.to(
          uMenuMode,
          {
            value: 0
          },
          0
        ));
    }
  }
  static menu() {
    (this.registerChange(),
      (this.current = "menu"),
      background.setSize(0.1),
      background.setGrainIntensity(1.29),
      background.setColor1("rgb(65,66,73)"),
      background.setColor2("rgb(36,39,51)"),
      background.setColor3("rgb(49,103,160)"),
      background.setColor4("rgb(117,153,245)"),
      (blurPass.scale = 5),
      (uColorMixer.value = 0.32),
      (uMenuMode.value = 1));
  }
  static culture(ze) {
    if ((this.registerChange(), (this.current = "culture"), !ze))
      (background.setSize(0.13),
        background.setGrainIntensity(1.32),
        background.setColor1(0.02624122, 0.02732089, 0.0343398),
        background.setColor2(0.00913405, 0.00972121, 0.01520851),
        background.setColor3(0.01096009, 0.07036009, 0.20863687),
        background.setColor4(0.00477695, 0.01370208, 0.06480326),
        (blurPass.scale = 2),
        (uColorMixer.value = 0),
        (uMenuMode.value = 0));
    else {
      const Gr = gsapWithCSS.timeline({
        defaults: {
          ease: "power2.inOut",
          duration: 1
        }
      });
      (Gr.to(
        uSize,
        {
          value: 0.13
        },
        0
      ),
        Gr.to(
          uIntensity,
          {
            value: 1.32
          },
          0
        ),
        Gr.to(
          uColor1.value,
          {
            r: 0.02624122,
            g: 0.02732089,
            b: 0.0343398
          },
          0
        ),
        Gr.to(
          uColor2.value,
          {
            r: 0.00913405,
            g: 0.00972121,
            b: 0.01520851
          },
          0
        ),
        Gr.to(
          uColor3.value,
          {
            r: 0.01096009,
            g: 0.07036009,
            b: 0.20863687
          },
          0
        ),
        Gr.to(
          uColor4.value,
          {
            r: 0.00477695,
            g: 0.01370208,
            b: 0.06480326
          },
          0
        ),
        Gr.to(
          blurPass,
          {
            scale: 2
          },
          0
        ),
        Gr.to(
          uColorMixer,
          {
            value: 0
          },
          0
        ),
        Gr.to(
          uMenuMode,
          {
            value: 0
          },
          0
        ));
    }
  }
}
(cs(PresetManager, "previous"), cs(PresetManager, "current"));
gsapWithCSS.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create("inOutCubic", "0.65, 0, 0.35, 1)");
CustomEase.create("outCubic", "0.16, 1, 0.3, 1");
const menu = () => {
    const Wr = document.querySelector(".header-left"),
      ze = document.querySelector(".header-menu"),
      Gr = document.querySelector(".header-aside"),
      Yr = document.querySelector(".toggle-menu"),
      Kr = document.querySelector("main").getAttribute("data-anim");
    let Zr = parseFloat(Kr) + 1,
      Jr,
      Qr,
      ei;
    (Kr || (Zr = 0),
      Wr &&
        gsapWithCSS.from(Wr, {
          y: "200%",
          opacity: 0,
          duration: 1.5,
          ease: "expo.inOut",
          delay: Zr
        }),
      ze &&
        gsapWithCSS.from(ze, {
          y: "200%",
          duration: 1.5,
          ease: "expo.inOut",
          delay: Zr + 0.05
        }),
      Gr &&
        gsapWithCSS.from(Gr, {
          y: "200%",
          duration: 1.5,
          ease: "expo.inOut",
          delay: Zr + 0.1
        }),
      Yr &&
        gsapWithCSS.from(Yr, {
          y: "200%",
          duration: 1.5,
          ease: "expo.inOut",
          delay: Zr + 0.1
        }));
    const ti = document.querySelector(".js-menu"),
      ri = document.querySelector(".js-menu-container"),
      ni = ti.querySelector(".js-menu-background"),
      ii = ti.querySelectorAll(".js-menu-link"),
      si = ti.querySelectorAll(".js-menu-bg-banner"),
      oi = document.querySelectorAll(".js-menu-link-text"),
      li = ti.querySelector(".js-menu-logo"),
      ui = ti.querySelectorAll(".js-toggle-menu .toggle-menu__bar"),
      ai = () => {
        ((document.body.style.pointerEvents = "none"),
          (Gr.style.pointerEvents = "none"));
      },
      fi = () => {
        ((document.body.style.pointerEvents = ""),
          (Gr.style.pointerEvents = ""));
      },
      ci = gsapWithCSS.matchMedia();
    (ci.add("(max-width: 767px)", () => {
      (bi(), Ri());
    }),
      ci.add("(min-width: 768px)", () => {
        (bi(), Ri());
      }));
    const hi = () => {
        (gsapWithCSS.set(si, {
          transformOrigin: "bottom"
        }),
          gsapWithCSS.set(ii, {
            "--scale": "0"
          }),
          setTimeout(() => {
            Jr.play(0);
          }, 300));
      },
      di = (Mi, Pi) => {
        ((ei = Pi),
          gsapWithCSS.set(si, {
            transformOrigin: "top"
          }),
          setTimeout(() => {
            Qr.play(0);
          }, Mi * 1e3));
      },
      pi = (Mi, Pi) => {
        (ai(),
          di(Mi, Pi),
          document.body.classList.remove("menu-is-open"),
          lenis$1.unblockScroll());
      },
      mi = () => {
        (ai(),
          document.body.classList.add("menu-is-active"),
          document.body.classList.add("menu-is-open"),
          lenis$1.blockScroll(),
          hi());
      },
      vi = document.querySelectorAll(".js-toggle-menu");
    vi.length > 0 &&
      vi.forEach((Mi) => {
        Mi.addEventListener("click", () => {
          document.body.classList.contains("menu-is-active") ? pi(0.2) : mi();
        });
      });
    const yi = ti.querySelectorAll("a");
    (yi.length > 0 &&
      yi.forEach((Mi) => {
        Mi.addEventListener("click", () => {
          (document.querySelector("main").setAttribute("data-anim-delay", 2),
            pi(0.5, Mi));
        });
      }),
      ii.length > 0 &&
        ii.forEach((Mi) => {
          (Mi.querySelector("svg") &&
            Mi.querySelectorAll(".js-menu-link-text .slice-el").forEach(
              (Ei) => {
                const Ai = Ei.querySelector(".js-menu-link-icon"),
                  Si = Ei.childNodes[0].textContent.trim();
                let Ti = Si.indexOf(" ");
                if (Ti > 0) {
                  var gi = Si.slice(0, Ti).trim(),
                    xi = Si.slice(Ti + 1, Si.length).trim();
                  (Ei.removeChild(Ei.childNodes[0]),
                    Ei.appendChild(document.createTextNode(gi)),
                    Ei.appendChild(Ai),
                    Ei.appendChild(document.createTextNode(xi)));
                }
              }
            ),
            Mi.addEventListener("mouseenter", () => {
              ii.forEach((Pi) => {
                Pi !== Mi &&
                  gsapWithCSS.to(Pi, {
                    opacity: 0.6,
                    duration: 0.5
                  });
              });
            }),
            Mi.addEventListener("mouseleave", () => {
              ii.forEach((Pi) => {
                gsapWithCSS.to(Pi, {
                  opacity: 1,
                  duration: 0.5
                });
              });
            }));
        }));
    function bi(Mi) {
      (Jr && Jr.kill(),
        (Jr = gsapWithCSS.timeline({
          paused: !0
        })),
        Jr.fromTo(
          ni,
          {
            scaleY: 0,
            opacity: 1
          },
          {
            scaleY: 1,
            opacity: 1,
            duration: 0.8,
            ease: "inOutCubic",
            onComplete: () => {
              (PresetManager.current != "menu" && PresetManager.menu(),
                document.querySelector(".js-menu-webgl").append(canvas$1));
            }
          }
        )
          .fromTo(
            si,
            {
              opacity: 0
            },
            {
              opacity: 1,
              duration: 0.01,
              ease: "none"
            },
            ">"
          )
          .to(
            ni,
            {
              opacity: 0,
              duration: 1,
              ease: "none"
            },
            "<"
          )
          .to(
            ui,
            {
              "--color": "#f0f1f5",
              duration: 0.5,
              ease: "outSine"
            },
            0
          )
          .fromTo(
            li,
            {
              opacity: 0
            },
            {
              opacity: 1,
              duration: 0.5,
              ease: "outCubic"
            },
            "<"
          )
          .fromTo(
            ii,
            {
              "--scale": "0"
            },
            {
              "--scale": "1",
              duration: 0.8,
              ease: "outCubic"
            },
            "<0.4"
          )
          .fromTo(
            oi,
            {
              y: "-115%"
            },
            {
              y: "0%",
              duration: 1,
              stagger: 0.05,
              ease: "outCubic"
            },
            "<"
          )
          .add(fi));
    }
    function Ri(Mi) {
      (Qr && Qr.kill(),
        (Qr = gsapWithCSS.timeline({
          paused: !0,
          defaults: {
            ease: "inOutCubic"
          }
        })),
        Qr.to(ni, {
          opacity: 1,
          duration: 0.1,
          ease: "none"
        })
          .add(() => {
            (document.querySelector(".webgl").append(canvas$1),
              gsapWithCSS.set(si, {
                transformOrigin: "bottom"
              }),
              ei != null && ei.href.includes("culture")
                ? PresetManager.culture()
                : PresetManager.set(PresetManager.previous));
          })
          .to(ti, {
            "--bottom-path": "0%",
            duration: 0.8,
            ease: CustomEase.create("easeOutCubic", ".25,.93,.87,1.01"),
            onComplete: () => {
              gsapWithCSS.set(ni, {
                opacity: 0,
                ease: "none"
              });
            }
          })
          .fromTo(
            ti,
            {
              filter: "brightness(100%)"
            },
            {
              filter: "brightness(20%)",
              duration: 0.8,
              ease: "none",
              onComplete: () => {
                gsapWithCSS.set(ti, {
                  filter: "brightness(100%)"
                });
              }
            },
            "<"
          )
          .to(
            oi,
            {
              y: "-115%",
              duration: 0.9,
              ease: CustomEase.create("easeOutCubic", ".25,.93,.87,1.01")
            },
            "<"
          )
          .to(
            ri,
            {
              y: "-20%",
              duration: 0.8,
              ease: CustomEase.create("easeOutCubic", ".25,.93,.87,1.01"),
              onComplete: () => {
                gsapWithCSS.set(ri, {
                  y: 0,
                  duration: 0,
                  ease: "none"
                });
              }
            },
            "<"
          )
          .add(() => {
            (gsapWithCSS.set(ti, {
              "--bottom-path": "100%",
              ease: "none"
            }),
              gsapWithCSS.set(oi, {
                y: "115%"
              }),
              gsapWithCSS.set(ii, {
                "--scale": "0"
              }),
              gsapWithCSS.set(li, {
                opacity: 0
              }),
              fi(),
              document.body.classList.remove("menu-is-active"));
          }));
    }
  },
  imagesTrail = () => {
    const Wr = document.body,
      ze = document.querySelector(".js-images-trail-container"),
      Gr = {
        lerp: (ri, ni, ii) => (1 - ii) * ri + ii * ni,
        distance: (ri, ni, ii, si) => Math.hypot(ii - ri, si - ni)
      },
      Yr = (ri) => {
        let ni = 0,
          ii = 0;
        return (
          ri.pageX || ri.pageY
            ? ((ni = ri.pageX), (ii = ri.pageY))
            : (ri.clientX || ri.clientY) &&
              ((ni = ri.clientX + Wr.scrollLeft),
              (ii = ri.clientY + Wr.scrollTop)),
          {
            x: ni,
            y: ii
          }
        );
      };
    let Kr,
      Zr,
      Jr =
        (Kr =
        Zr =
          {
            x: 0,
            y: 0
          });
    ze.addEventListener("mousemove", (ri) => {
      ri.target.closest("a") || (Jr = Yr(ri));
    });
    const Qr = () => Gr.distance(Jr.x, Jr.y, Kr.x, Kr.y);
    class ei {
      constructor(ni) {
        ((this.DOM = {
          el: ni
        }),
          (this.defaultStyle = {
            scale: 1,
            x: 0,
            y: 0,
            opacity: 0
          }),
          this.getRect(),
          this.initEvents());
      }
      initEvents() {
        window.addEventListener("resize", () => this.resize());
      }
      resize() {
        (gsapWithCSS.set(this.DOM.el, this.defaultStyle), this.getRect());
      }
      getRect() {
        this.rect = this.DOM.el.getBoundingClientRect();
      }
      isActive() {
        return (
          gsapWithCSS.isTweening(this.DOM.el) || this.DOM.el.style.opacity != 0
        );
      }
    }
    class ti {
      constructor() {
        ((this.DOM = {
          content: ze
        }),
          (this.contentPos = this.DOM.content.offsetTop),
          (this.images = []),
          [...this.DOM.content.querySelectorAll("img")].forEach((ni) =>
            this.images.push(new ei(ni))
          ),
          (this.imagesTotal = this.images.length),
          (this.imgPosition = 0),
          (this.zIndexVal = 1),
          (this.threshold = 100),
          gsapWithCSS.ticker.add(this.render.bind(this)));
      }
      render() {
        let ni = Qr();
        ((Zr.x = Gr.lerp(Zr.x || Jr.x, Jr.x, 0.1)),
          (Zr.y = Gr.lerp(Zr.y || Jr.y, Jr.y, 0.1)),
          ni > this.threshold &&
            (this.showNextImage(),
            ++this.zIndexVal,
            (this.imgPosition =
              this.imgPosition < this.imagesTotal - 1
                ? this.imgPosition + 1
                : 0),
            (Kr = Jr)));
        let ii = !0;
        for (let si of this.images)
          if (si.isActive()) {
            ii = !1;
            break;
          }
        ii && this.zIndexVal !== 1 && (this.zIndexVal = 1);
      }
      showNextImage() {
        const ni = this.images[this.imgPosition];
        gsapWithCSS.killTweensOf(ni.DOM.el);
        var ii = gsapWithCSS.timeline();
        ii.set(
          ni.DOM.el,
          {
            opacity: 1,
            scale: 1,
            zIndex: this.zIndexVal,
            x: Zr.x - ni.rect.width / 2,
            y: Zr.y - ni.rect.height / 2 - this.contentPos
          },
          0
        )
          .to(
            ni.DOM.el,
            {
              ease: "expo.out",
              x: Jr.x - ni.rect.width / 2,
              y: Jr.y - ni.rect.height / 2 - this.contentPos,
              duration: 0.9
            },
            0
          )
          .to(
            ni.DOM.el,
            {
              ease: "power1.out",
              opacity: 0,
              duration: 1
            },
            0.8
          )
          .to(
            ni.DOM.el,
            {
              ease: "sine.out",
              scale: 0.2,
              duration: 1
            },
            0.8
          );
      }
    }
    new ti();
  };
gsapWithCSS.registerPlugin(ScrollTrigger);
const revealText = (Wr) => {
    function ze(Zr, Jr) {
      const Qr = Wr.querySelectorAll(Zr);
      Qr.length > 0 &&
        (Qr.forEach((ei) => {
          let ti = "lines";
          (ei.dataset.split === "chars" && (ti = "lines, chars"),
            new SplitType(ei, {
              types: ti
            }).lines.map((ni) => {
              const ii = document.createElement("div");
              (ii.classList.add("line-wrapper"),
                (ii.style.overflow = "hidden"),
                ni.parentNode.appendChild(ii),
                ii.appendChild(ni));
            }));
        }),
        gsapWithCSS.utils.toArray(Zr).forEach((ei) => {
          const ti = ei.querySelector(".js-horizontal-reveal-text");
          let ri = ei.getAttribute("data-reveal");
          if ((ri || (ri = 0), !ei.closest(".s-timeline"))) {
            const ni = ei.querySelectorAll(".line"),
              ii = ei.querySelectorAll(".char");
            let si = ni;
            (ii.length > 0 && (si = ii),
              ni.length > 0 &&
                gsapWithCSS.fromTo(
                  si,
                  {
                    y: "115%"
                  },
                  {
                    y: 0,
                    duration: 1,
                    stagger: Jr,
                    ease: "power3.out",
                    scrollTrigger: {
                      trigger: ei,
                      start: "top 75%"
                    },
                    delay: parseFloat(ri),
                    onComplete: function () {
                      ei.classList.contains("is-revert") &&
                        SplitType.revert(ei);
                    }
                  }
                ));
            const oi = ei.querySelector(".slice-wrapper");
            (oi &&
              gsapWithCSS.to(
                oi,
                {
                  x: "-0.7rem",
                  duration: 1,
                  ease: "power3.out",
                  delay: parseFloat(ri + 1)
                },
                ">-0.2"
              ),
              ti &&
                gsapWithCSS.fromTo(
                  ti,
                  {
                    width: 0
                  },
                  {
                    scrollTrigger: {
                      trigger: ei,
                      start: "top 75%"
                    },
                    width: ti.querySelector("span").offsetWidth,
                    duration: 1.5,
                    ease: "expo.inOut",
                    delay: parseFloat(ri + 0.5)
                  }
                ));
          }
          ei.closest(".a--auto") &&
            gsapWithCSS.fromTo(
              ei.querySelectorAll(".line"),
              {
                y: "115%"
              },
              {
                y: 0,
                duration: 1,
                stagger: Jr,
                ease: "power3.out",
                delay: parseFloat(ri)
              }
            );
        }));
    }
    const Gr = ".a--text";
    Wr.querySelector(Gr) && ze(Gr, "0.08");
    const Yr = ".a--sm-text p";
    Wr.querySelector(Yr) && ze(Yr, "0.05");
    const Kr = () => {
      const Zr = Wr.querySelectorAll(".a--text, .a--sm-text p");
      Zr.length > 0 &&
        Zr.forEach((Jr) => {
          Jr.closest(".a--sm-text")
            ? Jr.closest(".a--sm-text").classList.contains("no-resize") ||
              SplitType.revert(Jr)
            : Jr.classList.contains("no-resize") || SplitType.revert(Jr);
        });
    };
    window.addEventListener("resize", Kr);
  },
  removeRevealText = (Wr) => {
    const ze = Wr.querySelectorAll(".a--text");
    ze &&
      ze.forEach((Gr) => {
        Gr.classList.remove("a--text");
      });
  };
gsapWithCSS.registerPlugin(ScrollTrigger);
const reveal = (Wr, ze) => {
  const Gr = gsapWithCSS.utils.toArray(Wr);
  Gr.length > 0 &&
    Gr.forEach((Yr) => {
      const Kr = Yr.querySelectorAll(ze);
      Kr.length > 0 &&
        gsapWithCSS.from(Kr, {
          opacity: 0,
          duration: 1,
          ease: "power1.inOut",
          stagger: 0.15,
          scrollTrigger: {
            trigger: Yr,
            start: "top bottom-=3%"
          }
        });
    });
};
gsapWithCSS.registerPlugin(ScrollTrigger);
function forceScrollTop$2() {
  (window.scrollTo(0, 0),
    typeof lenis$1 < "u" &&
      (lenis$1.scrollTo(0, {
        immediate: !0
      }),
      lenis$1.stop()));
}
