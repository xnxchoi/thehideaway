"use client";

import { lerp } from "@/utilities/rp_utils";
import { useMotionValueEvent, useScroll } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { useTempus } from "tempus/react";
import * as THREE from "three";
import {
  getLostHeroPostTheme,
  shouldPauseLostHeroVideo,
  shouldRenderLostHeroFrame
} from "./hero-scene-state";
import { getLostHeroTextureMediaRatio } from "./hero-media-state";
import { getLostHeroScrollProgress } from "./hero-scroll-motion";

type Props = {
  bagOpen: boolean;
  imageUrl: string;
  onReady: () => void;
  videoUrl?: string | null;
};

type LostHeroRuntime = {
  dispose: () => void;
  render: (time: number, deltaTime: number) => void;
  resize: () => void;
  syncPostTheme: () => void;
  syncScroll: (progress: number) => void;
  syncVideoState: () => void;
};

const LOST_RED = 0xff2323;
const LOST_WALL_FALLBACK = "#f5f3ef";
const LOST_BLACK_FALLBACK = "#030303";
const LOST_WHITE_FALLBACK = "#f8f7f2";
const TARGET_MEDIA_RATIO = 21 / 9;
const VIDEO_ZOOM_DURATION = 920;

function sourceDamp(
  current: number,
  target: number,
  amount: number,
  deltaMs: number
) {
  return lerp(current, target, 1 - Math.exp(-amount * 0.05 * deltaMs));
}

function lostHeroZoomEasing(progress: number) {
  let t = progress;

  for (let index = 0; index < 5; index += 1) {
    const inverse = 1 - t;
    const t2 = t * t;
    const t3 = t2 * t;
    const bezierX =
      3 * inverse * inverse * t * 0.62 + 3 * inverse * t2 * 0.28 + t3;
    const error = bezierX - progress;

    if (Math.abs(error) < 0.0001) break;

    const slope =
      3 * inverse * inverse * 0.62 +
      6 * inverse * t * (0.28 - 0.62) +
      3 * t2 * (1 - 0.28);

    t -= error / slope;
  }

  return 3 * (1 - t) * t * t + t * t * t;
}

function coverTexture(
  texture: THREE.Texture,
  mediaRatio: number,
  targetRatio: number
) {
  texture.center.set(0.5, 0.5);

  if (mediaRatio > targetRatio) {
    texture.repeat.set(targetRatio / mediaRatio, 1);
  } else {
    texture.repeat.set(1, mediaRatio / targetRatio);
  }

  texture.offset.set((1 - texture.repeat.x) / 2, (1 - texture.repeat.y) / 2);
  texture.needsUpdate = true;
}

function createHeroVideo(videoUrl: string) {
  const video = document.createElement("video");
  video.src = videoUrl;
  video.muted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.crossOrigin = "anonymous";
  video.setAttribute("webkit-playsinline", "true");
  video.setAttribute("disablePictureInPicture", "true");

  return video;
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;

    child.geometry.dispose();

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    materials.forEach((material) => material.dispose());
  });
}

function makePanel(
  width: number,
  height: number,
  material: THREE.Material,
  position: THREE.Vector3Tuple,
  rotation: THREE.Euler = new THREE.Euler()
) {
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    material
  );
  panel.position.set(...position);
  panel.rotation.copy(rotation);
  return panel;
}

function makeCable(
  points: THREE.Vector3[],
  material: THREE.Material,
  radius = 0.018
) {
  const curve = new THREE.CatmullRomCurve3(points);
  const geometry = new THREE.TubeGeometry(curve, 64, radius, 6, false);
  return new THREE.Mesh(geometry, material);
}

export function LostHeroScene({ bagOpen, imageUrl, onReady, videoUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<LostHeroRuntime | null>(null);
  const bagOpenRef = useRef(bagOpen);
  const documentHiddenRef = useRef(false);
  const inViewportRef = useRef(true);
  const onReadyRef = useRef(onReady);
  const scrollProgressRef = useRef(0);
  const { scrollY } = useScroll();

  const syncScrollProgress = useCallback((scrollValue: number) => {
    const viewportHeight =
      typeof window === "undefined" ? 1 : window.innerHeight || 1;
    const progress = getLostHeroScrollProgress(scrollValue, viewportHeight);
    scrollProgressRef.current = progress;
    runtimeRef.current?.syncScroll(progress);
  }, []);

  useMotionValueEvent(scrollY, "change", syncScrollProgress);

  useTempus(
    ({ time, deltaTime }) => {
      runtimeRef.current?.render(time, deltaTime);
    },
    { label: "lost-hero-scene", priority: 1 }
  );

  useEffect(() => {
    bagOpenRef.current = bagOpen;
    runtimeRef.current?.syncVideoState();
    runtimeRef.current?.syncPostTheme();
  }, [bagOpen]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    let disposed = false;
    let markedReady = false;

    const markReady = () => {
      if (markedReady || disposed) return;
      markedReady = true;
      onReadyRef.current();
    };

    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = 1;
    colorCanvas.height = 1;
    const colorContext = colorCanvas.getContext("2d", {
      willReadFrequently: true
    });

    const cssColor = (property: string, fallback: string) => {
      const root =
        canvas.closest<HTMLElement>(".lost-commerce-root") ??
        document.documentElement;
      const styles = getComputedStyle(root);
      return styles.getPropertyValue(property).trim() || fallback;
    };

    const cssColorToThree = (
      value: string,
      fallback: string,
      target = new THREE.Color()
    ) => {
      if (!colorContext) return target.set(fallback);

      try {
        colorContext.clearRect(0, 0, 1, 1);
        colorContext.fillStyle = value;
        colorContext.fillRect(0, 0, 1, 1);
        const [r, g, b] = colorContext.getImageData(0, 0, 1, 1).data;
        return target.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
      } catch {
        return target.set(fallback);
      }
    };

    const colorFromVar = (
      property: string,
      fallback: string,
      target = new THREE.Color()
    ) => cssColorToThree(cssColor(property, fallback), fallback, target);

    const sceneBgColor = colorFromVar("--bg", LOST_WALL_FALLBACK);
    const sceneBlackColor = colorFromVar("--black", LOST_BLACK_FALLBACK);
    const sceneWhiteColor = colorFromVar("--white", LOST_WHITE_FALLBACK);
    const redColor = new THREE.Color(LOST_RED);

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      canvas,
      powerPreference: "high-performance"
    });
    renderer.setClearColor(sceneBlackColor, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;

    const scene = new THREE.Scene();
    scene.background = sceneBlackColor.clone();

    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 80);
    camera.position.set(0, 2.05, 10);
    camera.lookAt(0, 1.72, -1.2);

    const cameraRig = new THREE.Group();
    cameraRig.add(camera);
    scene.add(cameraRig);

    const stage = new THREE.Group();
    scene.add(stage);

    const mediaMaterial = new THREE.MeshBasicMaterial({
      color: sceneWhiteColor,
      side: THREE.DoubleSide
    });
    const mediaPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(10.8, 10.8 / TARGET_MEDIA_RATIO),
      mediaMaterial
    );
    mediaPlane.position.set(0, 1.9, -1.25);
    stage.add(mediaPlane);

    const blackMaterial = new THREE.MeshBasicMaterial({
      color: sceneBlackColor,
      side: THREE.DoubleSide
    });
    const wallMaterial = new THREE.MeshBasicMaterial({
      color: sceneBgColor,
      side: THREE.DoubleSide
    });
    const whiteMaterial = new THREE.MeshBasicMaterial({
      color: sceneWhiteColor,
      side: THREE.DoubleSide
    });
    const redMaterial = new THREE.MeshBasicMaterial({
      color: redColor,
      side: THREE.DoubleSide
    });
    const redCableMaterial = new THREE.MeshBasicMaterial({
      color: redColor,
      transparent: true,
      opacity: 0.86
    });
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: sceneBlackColor,
      metalness: 0.36,
      roughness: 0.44
    });

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 18),
      floorMaterial
    );
    floor.position.set(0, -0.74, 2.8);
    floor.rotation.x = -Math.PI / 2;
    stage.add(floor);

    const rearWall = makePanel(26, 10, blackMaterial, [0, 2.7, -3.05]);
    stage.add(rearWall);

    const leftWall = makePanel(
      18,
      8,
      blackMaterial,
      [-8.8, 2.1, 2.4],
      new THREE.Euler(0, Math.PI / 2, 0)
    );
    const rightWall = makePanel(
      18,
      8,
      blackMaterial,
      [8.8, 2.1, 2.4],
      new THREE.Euler(0, -Math.PI / 2, 0)
    );
    stage.add(leftWall, rightWall);

    const frameTop = makePanel(11.3, 0.035, whiteMaterial, [0, 4.49, -1.18]);
    const frameBottom = makePanel(
      11.3,
      0.035,
      whiteMaterial,
      [0, -0.69, -1.18]
    );
    const frameLeft = makePanel(0.035, 5.2, whiteMaterial, [-5.62, 1.9, -1.18]);
    const frameRight = makePanel(0.035, 5.2, whiteMaterial, [5.62, 1.9, -1.18]);
    stage.add(frameTop, frameBottom, frameLeft, frameRight);

    const redSpine = makePanel(0.035, 6.4, redMaterial, [-6.16, 1.85, -1.08]);
    const redCut = makePanel(2.4, 0.03, redMaterial, [4.9, 4.08, -1.07]);
    stage.add(redSpine, redCut);

    const cableA = makeCable(
      [
        new THREE.Vector3(-6.2, 4.2, -0.95),
        new THREE.Vector3(-3.9, 5.05, -1.55),
        new THREE.Vector3(-1.2, 4.65, -1.05),
        new THREE.Vector3(2.2, 4.95, -1.5),
        new THREE.Vector3(5.7, 4.25, -0.95)
      ],
      redCableMaterial,
      0.014
    );
    const cableB = makeCable(
      [
        new THREE.Vector3(6.25, -0.4, -0.8),
        new THREE.Vector3(5.1, 1.25, -1.3),
        new THREE.Vector3(6.45, 2.7, -0.72),
        new THREE.Vector3(4.7, 4.28, -1.42)
      ],
      redCableMaterial,
      0.012
    );
    stage.add(cableA, cableB);

    const slats = new THREE.Group();
    for (let index = 0; index < 12; index += 1) {
      const height = 0.32 + (index % 4) * 0.16;
      const slat = makePanel(
        0.035,
        height,
        index % 5 === 0 ? redMaterial : wallMaterial,
        [-4.8 + index * 0.88, -0.38 + height / 2, -0.96]
      );
      slats.add(slat);
    }
    stage.add(slats);

    const imageTextureRef = { current: null as THREE.Texture | null };
    const videoTextureRef = { current: null as THREE.VideoTexture | null };
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      imageUrl,
      (texture) => {
        if (disposed) {
          texture.dispose();
          return;
        }

        texture.colorSpace = THREE.SRGBColorSpace;
        coverTexture(
          texture,
          getLostHeroTextureMediaRatio(texture.image, TARGET_MEDIA_RATIO),
          TARGET_MEDIA_RATIO
        );
        imageTextureRef.current = texture;
        mediaMaterial.map = texture;
        mediaMaterial.color.set(0xffffff);
        mediaMaterial.needsUpdate = true;
        markReady();
      },
      undefined,
      markReady
    );

    const readyTimer = window.setTimeout(markReady, 1200);
    let video: HTMLVideoElement | null = videoUrl
      ? createHeroVideo(videoUrl)
      : null;

    const playVideo = () => {
      if (!video || documentHiddenRef.current || bagOpenRef.current) return;

      void video
        .play()
        .then(() => {
          canvas.dataset.webglState = "playing";
        })
        .catch(() => undefined);
    };

    const pauseVideo = () => {
      if (video && !video.paused) video.pause();
      canvas.dataset.webglState = "paused";
    };

    const syncVideoState = () => {
      if (!video) return;

      if (
        shouldPauseLostHeroVideo({
          bagOpen: bagOpenRef.current,
          documentHidden: documentHiddenRef.current
        })
      ) {
        pauseVideo();
      } else {
        playVideo();
      }
    };

    const activateVideoTexture = () => {
      if (!video || videoTextureRef.current) return;

      const texture = new THREE.VideoTexture(video);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.flipY = true;

      const ratio =
        video.videoWidth && video.videoHeight
          ? video.videoWidth / video.videoHeight
          : TARGET_MEDIA_RATIO;
      coverTexture(texture, ratio, TARGET_MEDIA_RATIO);
      videoTextureRef.current = texture;
      mediaMaterial.map = texture;
      mediaMaterial.needsUpdate = true;
    };

    if (video) {
      video.addEventListener(
        "loadedmetadata",
        () => {
          activateVideoTexture();
          playVideo();
        },
        { once: true }
      );

      if (video.readyState >= 2) activateVideoTexture();
      video.load();
      playVideo();
    }

    const pointer = { x: 0, y: 0 };
    const current = { scroll: scrollProgressRef.current, x: 0, y: 0 };
    const naturalPosition = new THREE.Vector3();
    const lookTarget = new THREE.Vector3(0, 1.72, -1.2);
    const zoom = {
      active: false,
      open: false,
      originalPosition: new THREE.Vector3(),
      progress: 0,
      startedAt: 0,
      startPosition: new THREE.Vector3(),
      targetPosition: new THREE.Vector3()
    };

    const resize = () => {
      const width = canvas.clientWidth || window.innerWidth;
      const height = canvas.clientHeight || window.innerHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const syncPostTheme = () => {
      colorFromVar("--bg", LOST_WALL_FALLBACK, sceneBgColor);
      colorFromVar("--black", LOST_BLACK_FALLBACK, sceneBlackColor);
      colorFromVar("--white", LOST_WHITE_FALLBACK, sceneWhiteColor);

      renderer.setClearColor(sceneBlackColor, 1);
      scene.background = sceneBlackColor.clone();
      blackMaterial.color.copy(sceneBlackColor);
      floorMaterial.color.copy(sceneBlackColor);
      wallMaterial.color.copy(sceneBgColor);
      whiteMaterial.color.copy(sceneWhiteColor);
      redMaterial.color.copy(redColor);
      redCableMaterial.color.copy(redColor);

      canvas.dataset.lostPostTheme = getLostHeroPostTheme({
        bagOpen: bagOpenRef.current,
        videoOpen: document.body.dataset.lostVideoOpen === "true"
      });
    };

    const onPointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
      pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
    };

    const onWatchVideo = (event: Event) => {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      zoom.open = typeof detail?.open === "boolean" ? detail.open : !zoom.open;
      zoom.active = true;
      zoom.progress = 0;
      zoom.startedAt = performance.now();
      zoom.startPosition.copy(cameraRig.position);

      if (zoom.open) {
        zoom.targetPosition.set(0, -0.28, -5.9);
      } else {
        zoom.targetPosition.copy(zoom.originalPosition);
      }

      canvas.dataset.lostWatchVideo = zoom.open ? "opening" : "closing";
      syncVideoState();
      syncPostTheme();
    };

    const onVisibilityChange = () => {
      documentHiddenRef.current = document.hidden;
      syncVideoState();
    };

    const observer =
      "IntersectionObserver" in window
        ? new IntersectionObserver(
            ([entry]) => {
              inViewportRef.current = entry?.isIntersecting ?? true;
            },
            { rootMargin: "160px" }
          )
        : null;

    observer?.observe(canvas);

    const postThemeObserver = new MutationObserver(syncPostTheme);
    postThemeObserver.observe(document.body, {
      attributeFilter: ["data-lost-video-open"],
      attributes: true
    });
    postThemeObserver.observe(document.documentElement, {
      attributeFilter: ["data-theme", "class"],
      attributes: true
    });

    const render = (_time: number, deltaTime: number) => {
      if (disposed) return;

      if (
        !shouldRenderLostHeroFrame({
          documentHidden: documentHiddenRef.current,
          inViewport: inViewportRef.current
        })
      ) {
        return;
      }

      const deltaMs = Math.min(deltaTime || 16.6667, 50);
      current.scroll = sourceDamp(
        current.scroll,
        scrollProgressRef.current,
        0.16,
        deltaMs
      );
      current.x = sourceDamp(current.x, pointer.x, 0.1, deltaMs);
      current.y = sourceDamp(current.y, pointer.y, 0.1, deltaMs);

      naturalPosition.set(
        -current.x * 0.28,
        -current.scroll * 1.38 + current.y * 0.08,
        -current.scroll * 2.4
      );

      if (zoom.active) {
        zoom.progress = Math.min(
          (performance.now() - zoom.startedAt) / VIDEO_ZOOM_DURATION,
          1
        );
        cameraRig.position.lerpVectors(
          zoom.startPosition,
          zoom.targetPosition,
          lostHeroZoomEasing(zoom.progress)
        );

        if (zoom.progress >= 1) {
          zoom.active = false;
          canvas.dataset.lostWatchVideo = zoom.open ? "open" : "closed";
        }
      } else if (zoom.open) {
        cameraRig.position.copy(zoom.targetPosition);
      } else {
        zoom.originalPosition.copy(naturalPosition);
        cameraRig.position.copy(naturalPosition);
      }

      stage.rotation.y = current.x * 0.045;
      stage.rotation.x = -current.y * 0.018;
      stage.position.y = -current.scroll * 0.22;
      cableA.rotation.z = Math.sin(_time * 0.00022) * 0.015;
      cableB.rotation.z = Math.cos(_time * 0.00018) * 0.012;
      slats.position.y = Math.sin(_time * 0.0007) * 0.03;

      if (videoTextureRef.current && video && !video.paused) {
        videoTextureRef.current.needsUpdate = true;
      }

      lookTarget.set(current.x * 0.2, 1.72 + current.y * 0.12, -1.2);
      camera.lookAt(zoom.open ? mediaPlane.position : lookTarget);
      renderer.render(scene, camera);
    };

    runtimeRef.current = {
      dispose: () => undefined,
      render,
      resize,
      syncPostTheme,
      syncScroll: (progress: number) => {
        scrollProgressRef.current = progress;
      },
      syncVideoState
    };

    documentHiddenRef.current = document.hidden;
    resize();
    syncPostTheme();
    syncScrollProgress(window.scrollY || 0);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("lost:watch-video", onWatchVideo);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      runtimeRef.current = null;
      window.clearTimeout(readyTimer);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("lost:watch-video", onWatchVideo);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      observer?.disconnect();
      postThemeObserver.disconnect();

      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
        video = null;
      }

      imageTextureRef.current?.dispose();
      videoTextureRef.current?.dispose();
      disposeObject(stage);
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [imageUrl, syncScrollProgress, videoUrl]);

  return (
    <canvas
      aria-hidden
      className="lost-hero-canvas col-span-full row-span-full h-full max-h-[100svh] w-full bg-[var(--black)]"
      data-lost-hero-media={videoUrl ? "video" : "image"}
      ref={canvasRef}
    />
  );
}
