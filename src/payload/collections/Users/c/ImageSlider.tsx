"use client";
import * as THREE from "three";
import { IUniform } from "three";
import baseVertexShader from "./baseVertex.glsl";
import stickyFrag from "./stickyFrag.glsl";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import baseFragShader from "./baseFrag.glsl";
import backgroundFragShader from "./backgroundFrag.glsl";
import Tempus from "tempus";
import Lenis from "lenis";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type SlidePageTextureMap = Record<
  `tSlide${1 | 2 | 3 | 4}`,
  SlidePageProps
>;

interface SliderMaterialUniforms extends Record<string, IUniform> {
  opacity: { value: number };
  resolution: { value: THREE.Vector2 };
  i_resolution: { value: THREE.Vector2 };
  borderRadius: { value: number };
  fadeDensity: { value: number };
  fadePower: { value: number };
  borderWidth: { value: number };
  borderColor: { value: THREE.Color };
  slidePower1: { value: number };
  slidePower2: { value: number };
  slidePower3: { value: number };
  slidePower4: { value: number };
  tSlide1: { value: THREE.Texture };
  tSlide2: { value: THREE.Texture };
  tSlide3: { value: THREE.Texture };
  tSlide4: { value: THREE.Texture };
}

type SlidePageProps =
  | {
      video: {
        src: string;
      };
      image: undefined;
      tex: THREE.VideoTexture;
      el: HTMLVideoElement;
    }
  | {
      image: {
        src: string;
      };
      video: undefined;
      tex: THREE.Texture;
    };

interface WebglWrap {
  final: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  o_camera: THREE.OrthographicCamera;
  p_camera: THREE.PerspectiveCamera;
  far: number;
  fov: number;
  ready: boolean;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  aspect: number;
  padding: {
    x: number;
    y: number;
  };

  params: {
    edgePower: number;
    noiseSpeed: number;
    noiseDensity: number;
    waveSpeed: number;
    waveDisp: {
      x: number;
      y: number;
    };
    wavePower: number;
    mouse: {
      size: number;
      age: number;
    };
    trail: {
      power: number;
    };
  };
}

interface ImageScroller {
  slides: Array<{
    el: HTMLDivElement;
    visible: boolean;
    tl: GSAPTween | null;
    observer: IntersectionObserver | null;
    listener: IntersectionObserverCallback | null;
  }>;
  slideElMap: WeakMap<HTMLDivElement, number>;
}

interface ScreenWebGl {
  alpha: {
    fbo: THREE.WebGLRenderTarget;
    scene: THREE.Scene;
  };
  front: {
    fbo: THREE.WebGLRenderTarget;
    scene: THREE.Scene;
  };
  back: {
    fbo: THREE.WebGLRenderTarget;
    scene: THREE.Scene;
  };
  bgFront: THREE.Mesh;
  bgBack: THREE.Mesh;
}

interface StickySlides {
  ready: boolean;
  visible: boolean;
  global: THREE.Scene;
  borderRadius: number;
  params: {
    fadeDensity: number;
    fadePower: number;
    borderWidth: number;
  };
  translate: { x: number; y: number };
  textures: SlidePageTextureMap;

  width: number;
  height: number;
  top: number;
  left: number;
  mesh: THREE.Mesh & {
    material: THREE.ShaderMaterial & { uniforms: SliderMaterialUniforms };
  };
  material: THREE.ShaderMaterial;
  geometry: THREE.PlaneGeometry;
}

export function ImageSlider(props: {
  textures?: SlidePageTextureMap;
  element?: HTMLDivElement;
  container?: HTMLDivElement;
  imagePane?: HTMLDivElement;
  lenis?: Lenis;
}) {
  const { container, textures, lenis, element, imagePane } = props;
  const [flag, setFlag] = useState(false);
  const turned = useRef(false);
  useEffect(() => {
    if (
      textures &&
      element &&
      container &&
      imagePane &&
      lenis &&
      !turned.current
    ) {
      setFlag(true);
      turned.current = true;
    }
  }, [textures, element, container, imagePane, lenis]);
  return flag ? (
    <ImageSliderInternal
      textures={textures!}
      element={element!}
      container={container!}
      imagePane={imagePane!}
      lenis={lenis!}
    />
  ) : (
    <></>
  );
}

function ImageSliderInternal({
  container,
  textures,
  lenis,
  element,
  imagePane
}: {
  textures: SlidePageTextureMap;
  element: HTMLDivElement;
  container: HTMLDivElement;
  imagePane: HTMLDivElement;
  lenis?: Lenis;
}) {
  gsap.registerPlugin(ScrollTrigger);
  const COLOR = useMemo(
    () => ({
      table: {
        black: {
          hex: "#1f1f1f",
          three: new THREE.Color("#1f1f1f")
        },
        white: {
          hex: "#ffffff",
          three: new THREE.Color("#ffffff")
        },
        gray: {
          hex: "#ececec",
          three: new THREE.Color("#ececec")
        }
      }
    }),
    []
  );
  const _onceColor = useCallback(() => {
    (document.documentElement.style.setProperty(
      "--c-white",
      COLOR.table.white.hex
    ),
      document.documentElement.style.setProperty(
        "--c-black",
        COLOR.table.black.hex
      ));
  }, [COLOR]);

  const RESCALE = 0.1;
  const WW = useRef(window.innerWidth);
  const WH = useRef(window.innerHeight);

  const WEBGL = useRef<WebglWrap>({
    final: null!,
    o_camera: null!,
    p_camera: null!,
    far: 0,
    fov: 15,
    ready: !1,
    width: 0,
    height: 0,
    canvas: null!,
    renderer: null!,
    scene: null!,
    aspect: 0,
    padding: {
      x: 0,
      y: 0
    },

    params: {
      edgePower: 20,
      noiseSpeed: 0.5,
      noiseDensity: 5,
      waveSpeed: 0.5,
      waveDisp: {
        x: 5,
        y: 5
      },
      wavePower: 0.1,
      mouse: {
        size: 0.9,
        age: 0.2
      },
      trail: {
        power: 0.5
      }
    }
  });

  const getPxThree = useCallback(
    (e: number, t = WEBGL.current.width) => (e / window.innerWidth) * t,
    [WEBGL]
  );
  const getPxScaleThree = useCallback(
    (e: number, t: number) => {
      const n = t / WEBGL.current.width,
        r = window.innerWidth * n;
      return e / r;
    },
    [WEBGL]
  );
  const onResizeWebGL = useCallback(() => {
    ((WEBGL.current.width = WW.current * RESCALE),
      (WEBGL.current.height = WH.current * RESCALE),
      (WEBGL.current.aspect = WEBGL.current.width / WEBGL.current.height),
      (WEBGL.current.padding.x = getPxThree(20)),
      (WEBGL.current.padding.y = getPxThree(15)),
      WEBGL.current.final &&
        ((WEBGL.current.final.scale.x = WEBGL.current.width),
        (WEBGL.current.final.scale.y = WEBGL.current.height),
        (WEBGL.current.final.material.uniforms.resolution!.value.x =
          WEBGL.current.final.scale.x),
        (WEBGL.current.final.material.uniforms.resolution!.value.y =
          WEBGL.current.final.scale.y),
        (WEBGL.current.final.material.uniforms.i_resolution!.value.x = 1800),
        (WEBGL.current.final.material.uniforms.i_resolution!.value.y = 1063)),
      WEBGL.current.renderer.setSize(WW.current, WH.current),
      WEBGL.current.p_camera &&
        ((WEBGL.current.far =
          -(WEBGL.current.height / 2) /
          Math.tan((WEBGL.current.fov * Math.PI) / 180 / 2)),
        (WEBGL.current.p_camera.aspect =
          WEBGL.current.width / WEBGL.current.height),
        (WEBGL.current.p_camera.position.z = -WEBGL.current.far),
        WEBGL.current.p_camera.updateProjectionMatrix()),
      WEBGL.current.o_camera &&
        ((WEBGL.current.o_camera.left = -WEBGL.current.width / 2),
        (WEBGL.current.o_camera.right = WEBGL.current.width / 2),
        (WEBGL.current.o_camera.top = WEBGL.current.height / 2),
        (WEBGL.current.o_camera.bottom = -WEBGL.current.height / 2),
        (WEBGL.current.o_camera.near = -WEBGL.current.height / 2),
        (WEBGL.current.o_camera.far = WEBGL.current.height / 2),
        WEBGL.current.o_camera.updateProjectionMatrix()),
      onResizeScreenWebGL(),
      AboutMember.onResize());
  }, [RESCALE, getPxThree]);
  const updateSize = useCallback(() => {
    WW.current = window.innerWidth;
    WH.current = window.innerHeight;
    onResizeWebGL();
  }, [onResizeWebGL]);

  const RES = useMemo(() => {
    let res = Math.min(window.devicePixelRatio, 2);
    WW.current >= 1980
      ? (res = Math.min(window.devicePixelRatio, 1.5))
      : WW.current >= 1680
        ? (res = Math.min(window.devicePixelRatio, 1.75))
        : (res = Math.max(res, 1.3));
    return res;
  }, []);

  const WEBGL_SCREEN = useRef<ScreenWebGl>({
    alpha: {
      fbo: null!,
      scene: null!
    },
    front: {
      fbo: null!,
      scene: null!
    },
    back: {
      fbo: null!,
      scene: null!
    },
    bgFront: null!,
    bgBack: null!
  });
  const Slider = useRef<StickySlides>({
    ready: false,
    visible: !1,
    global: null!,
    borderRadius: 10,
    material: null!,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    translate: {
      x: 0,
      y: 0
    },
    textures: null!,
    mesh: null!,
    geometry: null!,

    params: { fadeDensity: 6.5, fadePower: 5, borderWidth: 0.15 }
  });
  const webglPlane = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);
  const webglShader = new THREE.ShaderMaterial({
    vertexShader: baseVertexShader,
    fragmentShader: `const int MAX_TRAIL_SIZE = 20;
			${baseFragShader}`,
    uniforms: {
      resolution: {
        value: {
          x: 0,
          y: 0
        }
      },
      i_resolution: {
        value: {
          x: 0,
          y: 0
        }
      },
      cBlack: {
        value: COLOR.table.black.three
      },
      cBg: {
        value: COLOR.table.gray.three
      },
      time: {
        value: 0
      },
      tMouse: {
        value: null
      },
      tFront: {
        value: null
      },
      tBack: {
        value: null
      },
      wakuNaiVisible: {
        value: 1
      },
      wakuSenOpacity: {
        value: 1
      }
    },
    transparent: !0
  });
  const _onInitWebGL = useCallback(() => {
    const element = webglShader;
    ((element.alphaTest = 0.5),
      (WEBGL.current.final = new THREE.Mesh(webglPlane, element)),
      WEBGL.current.scene.add(WEBGL.current.final));
  }, [webglPlane, webglShader]);
  const _onceWebGL = useCallback(
    (canvas: HTMLCanvasElement) => {
      ((WEBGL.current.width = WW.current * RESCALE),
        (WEBGL.current.height = WH.current * RESCALE),
        (WEBGL.current.canvas = canvas),
        (WEBGL.current.renderer = new THREE.WebGLRenderer({
          canvas: WEBGL.current.canvas,
          alpha: true,
          antialias: !1,
          premultipliedAlpha: false
        })),
        WEBGL.current.renderer.setPixelRatio(RES),
        (WEBGL.current.renderer.shadowMap.enabled = !1),
        (WEBGL.current.scene = new THREE.Scene()),
        (WEBGL.current.aspect = WEBGL.current.width / WEBGL.current.height),
        (WEBGL.current.o_camera = new THREE.OrthographicCamera(
          (-WEBGL.current.height * WEBGL.current.aspect) / 2,
          (WEBGL.current.height * WEBGL.current.aspect) / 2,
          WEBGL.current.height / 2,
          -WEBGL.current.height / 2,
          -WEBGL.current.height / 2,
          WEBGL.current.height / 2
        )),
        (WEBGL.current.o_camera.position.z = 1),
        _onInitWebGL(),
        (WEBGL.current.padding = {
          x: 0,
          y: 0
        }),
        (WEBGL.current.ready = !0));
    },
    [_onInitWebGL, RESCALE]
  );

  const _onUpdateWebGL = useCallback(() => {
    WEBGL.current.final.material &&
      (WEBGL.current.final.material.uniforms.time!.value += 0.01);
    /***
      (WEBGL.current.final.material.uniforms.wakuNaiVisible.value =
            PAGE_TRANSITION.page.single.ptFade +
            PAGE_TRANSITION.page.works.ptFade +
            PAGE_TRANSITION.page.info.ptFade),
            (WEBGL.current.final.material.uniforms.wakuSenOpacity.value =
              PAGE_TRANSITION.page["error-500"].ptFadeMouse +
              PAGE_TRANSITION.page["error-404"].ptFadeMouse +
              PAGE_TRANSITION.page.info.ptFadeMouse +
              PAGE_TRANSITION.page.works.ptFadeMouse +
              PAGE_TRANSITION.page.home.ptFadeMouse),
		 */
  }, []);
  const _onRenderScreenWebGL = useCallback(() => {
    (WEBGL.current.renderer.setRenderTarget(WEBGL_SCREEN.current.front.fbo),
      WEBGL.current.renderer.render(
        WEBGL_SCREEN.current.front.scene,
        WEBGL.current.o_camera
      ),
      WEBGL.current.renderer.setRenderTarget(WEBGL_SCREEN.current.back.fbo),
      WEBGL.current.renderer.render(
        WEBGL_SCREEN.current.back.scene,
        WEBGL.current.o_camera
      ));
  }, []);
  const onRenderWebGL = useCallback(() => {
    (_onUpdateWebGL(), _onRenderScreenWebGL());
    AboutMember.onRender();
    (WEBGL.current.renderer.setRenderTarget(null),
      WEBGL.current.renderer.render(
        WEBGL.current.scene,
        WEBGL.current.o_camera
      ));
  }, [_onUpdateWebGL, _onRenderScreenWebGL]);

  const onceScreenWebGL = () => {
    ((WEBGL_SCREEN.current.front.scene = new THREE.Scene()),
      (WEBGL_SCREEN.current.front.fbo = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBFormat
        }
      )),
      (WEBGL_SCREEN.current.back.scene = new THREE.Scene()),
      (WEBGL_SCREEN.current.back.fbo = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
        {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBFormat
        }
      )),
      (WEBGL.current.final.material.uniforms!.tFront!.value =
        WEBGL_SCREEN.current.front.fbo.texture!),
      (WEBGL.current.final.material.uniforms!.tBack!.value =
        WEBGL_SCREEN.current.back.fbo.texture!),
      onInitBackgroundScreenWebGL(),
      onResizeScreenWebGL());
  };
  const onInitBackgroundScreenWebGL = () => {
    let i, element;
    ((i = new THREE.PlaneGeometry(1, 1, 1, 1)),
      (element = new THREE.ShaderMaterial({
        vertexShader: baseVertexShader,
        fragmentShader: backgroundFragShader,
        uniforms: {
          opacity: {
            value: 0.0
          },
          cBg: {
            value: COLOR.table.gray.three
          }
        }
      })),
      (WEBGL_SCREEN.current.bgFront = new THREE.Mesh(i, element)),
      WEBGL_SCREEN.current.front.scene.add(WEBGL_SCREEN.current.bgFront),
      (element = new THREE.ShaderMaterial({
        vertexShader: baseVertexShader,
        fragmentShader: backgroundFragShader,
        uniforms: {
          opacity: {
            value: 0
          },
          cBg: {
            value: COLOR.table.gray.three
          }
        }
      })),
      (WEBGL_SCREEN.current.bgBack = new THREE.Mesh(i, element)),
      WEBGL_SCREEN.current.back.scene.add(WEBGL_SCREEN.current.bgBack));
  };
  const onResizeScreenWebGL = () => {
    (WEBGL_SCREEN.current.front.fbo &&
      WEBGL_SCREEN.current.front.fbo.setSize(
        window.innerWidth * RES,
        window.innerHeight * RES
      ),
      WEBGL_SCREEN.current.back.fbo &&
        WEBGL_SCREEN.current.back.fbo.setSize(
          window.innerWidth * RES,
          window.innerHeight * RES
        ),
      WEBGL_SCREEN.current.bgFront &&
        ((WEBGL_SCREEN.current.bgFront.scale.x = WEBGL.current.width),
        (WEBGL_SCREEN.current.bgFront.scale.y = WEBGL.current.height)),
      WEBGL_SCREEN.current.bgBack &&
        ((WEBGL_SCREEN.current.bgBack.scale.x = WEBGL.current.width),
        (WEBGL_SCREEN.current.bgBack.scale.y = WEBGL.current.height)));
  };

  const onDestroyScreenWebGL = () => {};

  const _onResizeSlider = useCallback(() => {
    const element = imagePane;
    if (element) {
      const trigger = element.getBoundingClientRect();
      ((Slider.current.width = trigger.width),
        (Slider.current.height = trigger.height),
        (Slider.current.top = WH.current),
        (Slider.current.left = trigger.left),
        (Slider.current.mesh.scale.x = getPxThree(Slider.current.width)),
        (Slider.current.mesh.scale.y = getPxThree(Slider.current.height)),
        (Slider.current.mesh.material.uniforms.resolution.value.x =
          Slider.current.mesh.scale.x),
        (Slider.current.mesh.material.uniforms.resolution.value.y =
          Slider.current.mesh.scale.y),
        (Slider.current.mesh.material.uniforms.borderRadius.value =
          getPxScaleThree(
            Slider.current.borderRadius - 2,
            Slider.current.mesh.scale.x
          )),
        (Slider.current.mesh.position.x =
          -WEBGL.current.width / 2 +
          getPxThree(Slider.current.left) +
          Slider.current.mesh.scale.x / 2 +
          Slider.current.translate.x),
        (Slider.current.mesh.position.y =
          WEBGL.current.height / 2 -
          getPxThree(WH.current * 1.5) +
          Slider.current.translate.y));
    }
  }, [imagePane, getPxScaleThree, getPxThree]);
  const onScrollSlider = useCallback(
    (element = 0, trigger = 0, start = 0) => {
      Slider.current.mesh &&
        ((Slider.current.translate.y =
          trigger != 1 ? getPxThree(element) : getPxThree(WH.current)),
        (Slider.current.mesh.position.y =
          WEBGL.current.height / 2 -
          getPxThree(WH.current * 1.5) +
          Slider.current.translate.y));
    },
    [getPxScaleThree, getPxThree]
  );

  const _initSlider = useCallback(() => {
    Slider.current.global = WEBGL_SCREEN.current.front.scene;
    Slider.current.global &&
      (((Slider.current.geometry = new THREE.PlaneGeometry(1, 1, 1, 1)),
      (Slider.current.material = new THREE.ShaderMaterial({
        vertexShader: baseVertexShader,
        fragmentShader: stickyFrag,
        transparent: !0,
        uniforms: {
          opacity: {
            value: 0
          },
          resolution: {
            value: {
              x: 0,
              y: 0
            }
          },
          i_resolution: {
            value: {
              x: 0,
              y: 0
            }
          },
          borderRadius: {
            value: 0
          },
          fadeDensity: {
            value: Slider.current.params.fadeDensity
          },
          fadePower: {
            value: Slider.current.params.fadePower
          },
          borderWidth: {
            value: Slider.current.params.borderWidth
          },
          borderColor: {
            value: COLOR.table.white.three
          },
          slidePower1: {
            value: 0
          },
          slidePower2: {
            value: 0
          },
          slidePower3: {
            value: 0
          },
          slidePower4: {
            value: 0
          },
          tSlide1: {
            value: null
          },
          tSlide2: {
            value: null
          },
          tSlide3: {
            value: null
          },
          tSlide4: {
            value: null
          }
        }
      })),
      (Slider.current.mesh = new THREE.Mesh(
        Slider.current.geometry,
        Slider.current.material
      ) as unknown as THREE.Mesh & {
        material: THREE.ShaderMaterial & { uniforms: SliderMaterialUniforms };
      }),
      Slider.current.global.add(Slider.current.mesh)),
      _onResizeSlider(),
      onScrollSlider(),
      (Slider.current.textures = {
        ...textures
      }));
  }, [_onResizeSlider, onScrollSlider]);
  const _onUnmountSlider = useCallback(() => {
    Slider.current.mesh && Slider.current.mesh.remove();
    Slider.current.material && Slider.current.material.dispose();
    (
      Object.keys(Slider.current.textures) as (keyof SlidePageTextureMap)[]
    ).forEach((element, trigger) => {
      if (Slider.current.textures[element]) {
        "el" in Slider.current.textures[element] &&
          Slider.current.textures[element].el &&
          (Slider.current.textures[element].el.remove(),
          (Slider.current.textures[element].el = null!));
        "tex" in Slider.current.textures[element] &&
          (Slider.current.textures[element].tex &&
            Slider.current.textures[element].tex.dispose(),
          (Slider.current.textures[element].tex = null!));
      }
    });
  }, []);
  const onLoadTextureSlider = useCallback(() => {
    const wAspect = WW.current / WH.current;
    Object.keys(Slider.current.textures).forEach((element, trigger) => {
      const start =
        Slider.current.textures[element as keyof SlidePageTextureMap];
      let end: string = null!;
      if (start.video) {
        ((end = start.video.src),
          (start.el = document.createElement("video")),
          ((start.tex = new THREE.VideoTexture(start.el)),
          (start.el.preload = "metadata"),
          (start.el.muted = !0),
          (start.el.loop = !0),
          start.el.setAttribute("crossorigin", "anonymous"),
          start.el.setAttribute("muted", ""),
          start.el.setAttribute("playsinline", "playsinline"),
          (start.el.src = end)));
      } else {
        end = start.image.src;
        start.tex = new THREE.TextureLoader().load(end);

        Slider.current.material.uniforms[element] &&
          (Slider.current.material.uniforms[element].value = start.tex);
      }
    });
  }, []);

  const _onSyncSlider = (index: number, trigger: number) => {
    const start = Math.min(trigger * 2, 1);
    switch (index) {
      case 0:
        Slider.current.mesh.material.uniforms.slidePower1.value = start;
        break;
      case 1:
        Slider.current.mesh.material.uniforms.slidePower2.value = start;
        break;
      case 2:
        Slider.current.mesh.material.uniforms.slidePower3.value = start;
        break;
      case 3:
        Slider.current.mesh.material.uniforms.slidePower4.value = start;
        break;
    }
  };
  const onRenderSlider = useCallback(() => {
    Slider.current.mesh &&
      ((Slider.current.mesh.visible = Slider.current.visible),
      (Slider.current.mesh.position.x =
        -WEBGL.current.width / 2 +
        getPxThree(Slider.current.left) +
        Slider.current.mesh.scale.x / 2 +
        Slider.current.translate.x),
      (Slider.current.mesh.material.uniforms.fadeDensity.value =
        Slider.current.params.fadeDensity),
      (Slider.current.mesh.material.uniforms.fadePower.value =
        Slider.current.params.fadePower),
      (Slider.current.mesh.material.uniforms.borderWidth.value =
        Slider.current.params.borderWidth));
  }, [getPxThree]);
  const onDestroySlider = useCallback(() => {
    Slider.current.mesh &&
      ((Slider.current.mesh.visible = !1),
      (Slider.current.mesh.material.uniforms.slidePower1.value = 0),
      (Slider.current.mesh.material.uniforms.slidePower2.value = 0),
      (Slider.current.mesh.material.uniforms.slidePower3.value = 0),
      (Slider.current.mesh.material.uniforms.slidePower4.value = 0));
    // Object.keys(Slider.current.textures).forEach((element, trigger) => {
    //   const start = Slider.current.textures[element];
    //   start.el = null;
    // })
  }, []);

  const scrollerRef = useRef<ImageScroller>({
    slides: [],
    slideElMap: new WeakMap()
  });

  const unmountLenis = useRef<(() => void) | undefined>(undefined);
  const handleScroll = useCallback(
    (lenis: Lenis) => {
      const { limit, scroll, progress, actualScroll } = lenis;
      if (!container) return;

      const ff1 = Math.min(scroll / WH.current, 1);
      const ff2 = Math.max((scroll - WH.current) / (limit - WH.current), 0);
      container.style.setProperty("--f1", ff1.toString());
      container.style.setProperty("--f2", ff2.toString());
      AboutMember.ready && AboutMember.onScroll(scroll, ff1, ff2);
    },
    [container]
  );
  const _initLenis = useCallback(() => {
    if (lenis) {
      lenis.on("scroll", handleScroll);
      unmountLenis.current = () => {
        lenis.off("scroll", handleScroll);
      };
    }
  }, [lenis, container]);
  const slides = useRef<HTMLDivElement[]>([]);
  useEffect(() => {
    const all = document.querySelectorAll("[data-slide]");
    if (all && all.length) {
      all.forEach((element, index) => {
        const divEl = element as HTMLDivElement;
        slides.current.push(divEl);
      });
    }
  }, []);
  const _initScroller = useCallback(() => {
    slides.current.length > 0 &&
      slides.current.forEach((element, index) => {
        const divEl = element as HTMLDivElement;
        scrollerRef.current.slides.push({
          visible: false,
          tl: null,
          observer: null,
          listener: null,
          el: divEl
        });
        scrollerRef.current.slideElMap.set(divEl, index);
      });
    scrollerRef.current.slides.forEach((element) => {
      const divEl = element.el;
      element.listener = (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.tl = gsap.to(element.el, {
              ease: "none",
              scrollTrigger: {
                scroller: document.documentElement,
                trigger: element.el,
                scrub: 0.01,
                start: "top bottom",
                end: "bottom top",
                onUpdate: (o) => {
                  if (!AboutMember.ready) return;
                  const index = scrollerRef.current.slideElMap.get(divEl);
                  if (typeof index !== "number") return;
                  if (index > 3) return;
                  if (index < 0) return;
                  const start = Math.min(o.progress * 2, 1);
                  const selector =
                    `slidePower${index + 1}` as `slidePower${1 | 2 | 3 | 4}`;
                  divEl.style.setProperty("--p1", o.progress.toString());
                  divEl.style.setProperty("--p2", (1 - o.progress).toString());
                  Slider.current.mesh.material.uniforms[selector].value = start;
                }
              }
            });
          }
        });
      };
      element.observer = new IntersectionObserver(element.listener, {
        threshold: 0
      });
      element.observer.observe(element.el);
    });
  }, []);
  const onDestroyScroller = useCallback(() => {
    scrollerRef.current.slides.forEach((element) => {
      element.observer && element.observer.disconnect();
      element.tl && element.tl.kill();
      element.tl = null;
      element.observer = null;
      element.listener = null;
      element.el.remove();
    });
  }, []);
  const AboutMember = useMemo(
    () => ({
      ready: false,
      init: () => {
        _initSlider();
        onScrollSlider(0, 0, 0);
        AboutMember.ready = true;
      },
      onLoaded: () => {
        onLoadTextureSlider();
      },
      onScroll: (a: number, b: number, c: number) => {
        onScrollSlider(a, b, c);
      },
      onRender: () => {
        if (!AboutMember.ready) return;
        Slider.current.visible = true;
        Slider.current.mesh.material.uniforms.opacity.value = 1;
        onRenderSlider();
      },
      onResize: () => {
        _onResizeSlider();
      },
      onDestroy: () => {
        onDestroySlider();
        _onUnmountSlider();
      }
    }),
    [
      onScrollSlider,
      _initSlider,
      _onResizeSlider,
      _onUnmountSlider,
      onLoadTextureSlider,
      onRenderSlider,
      onDestroySlider
    ]
  );
  const remover = useRef<() => void | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null!);
  const root = useMemo(
    () => ({
      init: () => {
        const canvas = document.createElement("canvas");
        canvas.style.setProperty("display", "block");
        canvas.style.setProperty("position", "fixed");
        canvas.style.setProperty("inset", "0");
        canvas.style.setProperty("z-index", "-1");
        canvas.style.setProperty("background-color", "transparent");
        canvas.style.setProperty("pointer-events", "none");
        canvas.style.setProperty("width", "100vw");
        canvas.style.setProperty("height", "100svh");
        canvasRef.current = element.appendChild(canvas);
        _onceColor();
        _onceWebGL(canvas);
        onceScreenWebGL();
        _initLenis();
        _initScroller();
        AboutMember.init();

        AboutMember.onLoaded();
        onResizeWebGL();
      },

      onRender: () => {
        const a = Tempus.add((time, deltaTime) => {
          onRenderWebGL();
        });
        a && (remover.current = a);
      },
      onResize: () => {
        updateSize();
      },
      unmount: () => {
        unmountLenis.current && unmountLenis.current();
        document.removeEventListener("resize", updateSize);
        canvasRef.current && canvasRef.current.remove();
        canvasRef.current = null!;
        AboutMember.onDestroy();
        WEBGL_SCREEN.current.front.fbo &&
          WEBGL_SCREEN.current.front.fbo.dispose();
        WEBGL_SCREEN.current.back.fbo &&
          WEBGL_SCREEN.current.back.fbo.dispose();
        WEBGL_SCREEN.current.alpha.fbo &&
          WEBGL_SCREEN.current.alpha.fbo.dispose();
        WEBGL_SCREEN.current.alpha.scene &&
          WEBGL_SCREEN.current.alpha.scene.removeFromParent();
        WEBGL_SCREEN.current.front.scene &&
          WEBGL_SCREEN.current.front.scene.removeFromParent();
        WEBGL_SCREEN.current.back.scene &&
          WEBGL_SCREEN.current.back.scene.removeFromParent();
        const bb = WEBGL_SCREEN.current.bgBack;
        if (Array.isArray(bb.material)) {
          bb.material.forEach((element) => {
            element.dispose();
          });
        } else if (bb.material) {
          bb.material.dispose();
        }
        bb.geometry && bb.geometry.dispose();
        const bf = WEBGL_SCREEN.current.bgFront;
        if (Array.isArray(bf.material)) {
          bf.material.forEach((element) => {
            element.dispose();
          });
        } else if (bf.material) {
          bf.material.dispose();
        }
        bf.geometry && bf.geometry.dispose();
        WEBGL.current.final.material && WEBGL.current.final.material.dispose();
        WEBGL.current.final.geometry && WEBGL.current.final.geometry.dispose();
        WEBGL.current.renderer.dispose();
        onDestroyScreenWebGL();
        onDestroyScroller();
        remover.current && remover.current();
      }
    }),
    [
      onRenderWebGL,
      onceScreenWebGL,
      _onceColor,
      _onceWebGL,
      _initLenis,
      _initScroller,
      AboutMember,
      onDestroyScroller,
      onDestroyScreenWebGL,
      onDestroySlider,
      onResizeWebGL,
      updateSize
    ]
  );
  const runflag = useRef(false);

  useEffect(() => {
    if (!runflag.current) {
      root.init();
      root.onRender();
      runflag.current = true;
    }
  }, []);
  return <></>;
}
