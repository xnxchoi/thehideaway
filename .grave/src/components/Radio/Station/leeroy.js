/** an incomplete rip of the website main js from leeroy.ca
 *  Intentionally truncated for the truly essential parts
 *  Sizeable chunks of the code will be missing; if the rest of the code can function without introducing too code, do so.
 *  If not possible, leave it out after annotating in enough detail for me to understand what role the missing part likely plays, and why implementing it ourselves would not be possible without a considerable amount of code.
 *
 *  The rendered scene in the website is a semi-interactive, ever-shifting "blobs" of dark gradient- the shape largely mirroring that of the texture image
 *  /assets/seamless.png (which was also taken from the site).
 *  The rendering stacks multiple layers of effects as effect passes : from bottom, gradient; displacement; blur; render.
 *  I DO NOT want the effects from displacement - which basically "displaces" pixels in blocky pixellated mnanner, synced to mouse movements.
 *
 *  the main point of replication here are threefold: 1) the grain (***); 2) the "folds" (**) - the folds are thick and pronounced; we need to mirror that; and 3) gradients, includig how they manage color.
 *
 *  what should be proprietary are two:
 *
 *  1) colors (*****) I need two sets of palettes - each comprised of 4 colors. Note how the leeroy.ca code composes the palette with two base colors, and two accented colors.
 *  Our website's brand color is red- similar to Ferrari's rosso corsa. However, I have been increasingly using orange and teal in designs, so perhaps we can invest properly into creating a palette based on the three colors which
 *  a) "pop out", b) feel like the colors seen in 70's and 80's magazines: faded, popart-like, and luscious -enough to make things look better just from using them in the colors; and c) apply best practices in brand design and palette selection; approach as how top-tier elite design consultancies would approach the issue.
 *
 *  2) interactivity- especially the effect of "pulsing/hallations", as seen in Apple Music lyrics' backgrounds: subtle enough to not notice, but kientic enough to vibe for those who care.
 *  https://preview.redd.it/request-apple-music-gradient-background-but-without-lyrics-v0-ecf5kx8zwah41.jpg?width=1080&crop=smart&auto=webp&s=586298b64e66703c132400607fba9b55e0e790a7
 *  the "blobs" in the background-blurred, gradient palette like ours- will "jolt" and "pulsate" in rhythm to the playing music, but in pretty minimal amounts.
 *  p.s.:
 *  the leeroy website isn't responsive and just imposes a dark theme. We,on the other hand, should support both)
 *  base: darker, almost (but just subtly leaning into hues consistent with the accents) non-colored, neutral tones to fill the scene
 *  accent: two colors of different shades under the same hue.
 *
 *
 *
 *
 *
 *
 * **/

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
  uXCount = new Uniform(size.with / pixelSize),
  uYCount = new Uniform(size.height / pixelSize),
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
let gui;
function debug() {
  function Wr() {
    ((gui = new GUI({
      name: "grain",
      closed: !0
    })),
      gui.slider({
        name: "intensity",
        obj: uIntensity,
        prop: "value",
        max: 100
      }));
  }
  function ze() {
    (gui && gui.kill(), (gui = void 0));
  }
  return {
    mount: Wr,
    unmount: ze
  };
}
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
