"use client";

/**
 * TapeModel — inner R3F scene component for the tape player 3D model.
 *
 * Converted from the minified vanilla Three.js script in ./rip/tape3d.js.
 * See the plan file for a full symbol-decoding table.
 *
 * ─── Asset TODO list ──────────────────────────────────────────────────────────
 * Before shipping to production, download the four assets and place them at:
 *
 *   /public/draco/draco_wasm_wrapper.js   ← already in rip/, move it
 *   /public/draco/draco_decoder.wasm      ← already in rip/, move it
 *   /public/models/tape/SFmodel42.gltf    ← download from original GitHub URL
 *   /public/env/urban_alley_01_1k.hdr     ← download from original GitHub URL
 *   /public/video/display.mp4             ← download from original GitHub URL
 *
 * Then update the TODO comments below to use the /public/ paths.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRadioStore } from "@/providers/RadioProvider";
import { useWindowResize } from "@/utilities/use_window_resize";
import {
  Environment,
  OrbitControls,
  PerspectiveCamera,
  RenderTexture,
  useGLTF
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLenis } from "lenis/react";
import { useMotionValue } from "motion/react";
import {
  use,
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef
} from "react";
import {
  ACESFilmicToneMapping,
  BufferGeometry,
  Color,
  LinearFilter,
  Material,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Object3D,
  PCFSoftShadowMap,
  PointLight,
  RGBAFormat,
  SRGBColorSpace,
  Vector3,
  VideoTexture
} from "three";
import { OrbitControls as OrbitControls_ } from "three-stdlib";
import { useShallow } from "zustand/shallow";
import { Text } from "@react-three/drei";
gsap.registerPlugin(ScrollTrigger);
const ralewayDots = import("@/../public/assets/fonts/RalewayDots.ttf");
// ─── DRACO decoder path ───────────────────────────────────────────────────────
// The files are already copied to /public/draco/ (from rip/).
useGLTF.setDecoderPath("/draco/");

// ─── Asset URLs ───────────────────────────────────────────────────────────────
// Assets are served from the project's /public/ directory.
// Update these paths once the actual model/env/video files are in place.

const MODEL_URL = "/assets/three/tape/player.gltf";
const HDR_URL = "/assets/three/tape/urban_alley_01_1k.hdr";
const VIDEO_URL = "/assets/three/tape/Display.mp4";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Constant idle disk rotation speed (Gb in original). */
const BASE_DISK_SPEED = -0.005;

/** Initial model rotation.y */
const INIT_ROT_Y = -0.6;
const PRESSED_ROT_Z = 0.07;
/** Initial model position.y */
const INIT_POS_Y = -0.2;
/** Button state change animation duration in milliseconds */
const BUTTON_ANIM_DURATION = 200;

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Sets ACESFilmic tone mapping + SRGBColorSpace + PCFSoftShadowMap on the
 * shared renderer when the tape scene mounts, then restores the previous
 * values on unmount so other Views (VGradient, Lanyard, etc.) are unaffected.
 */
function TapeRendererSetup() {
  const { gl } = useThree();
  useEffect(() => {
    const prev = {
      toneMapping: gl.toneMapping,
      toneMappingExposure: gl.toneMappingExposure,
      outputColorSpace: gl.outputColorSpace,
      shadowMapType: gl.shadowMap.type
    };
    gl.toneMapping = ACESFilmicToneMapping;
    gl.toneMappingExposure = 1;
    gl.outputColorSpace = SRGBColorSpace;
    gl.shadowMap.type = PCFSoftShadowMap;
    return () => {
      gl.toneMapping = prev.toneMapping;
      gl.toneMappingExposure = prev.toneMappingExposure;
      gl.outputColorSpace = prev.outputColorSpace;
      gl.shadowMap.type = prev.shadowMapType;
    };
  }, [gl]);
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────

interface TapeModelProps {
  scrollTriggerId?: string;
  /**
   * Whether the parent container is currently in the viewport.
   * Controls `makeDefault` on the PerspectiveCamera and `enabled` on
   * OrbitControls so they don't compete with other Views when off-screen.
   */
  inView: boolean;
}

export function TapeModel({
  scrollTriggerId = "webgl_trigger",
  inView
}: TapeModelProps) {
  const controlsRef = useRef<OrbitControls_>(null!);
  const { scene } = useGLTF(MODEL_URL);
  /** The "Disk" mesh that spins in response to scroll velocity. */
  const diskRef = useRef<Object3D | null>(null);
  const playButtonRef = useRef<Object3D | null>(null);
  const pauseButtonRef = useRef<Object3D | null>(null);
  const forwardButtonRef = useRef<Object3D | null>(null);
  const rewindButtonRef = useRef<Object3D | null>(null);
  const activeButtonRef = useRef<Object3D | null>(null);
  const INITIAL_CAMERA_POS = useMemo(() => new Vector3(-8, -3, 15), []);
  const INITIAL_TARGET_POS = useMemo(() => new Vector3(0, 0, 0), []);
  /** Raw scroll velocity fed by Lenis (hg in original). */
  const scrollVelocityRef = useRef(0);

  /** Exponentially smoothed velocity (qc in original). */
  const smoothedVelocityRef = useRef(0);
  const rale = use(async () => await ralewayDots.then((r) => r.default));
  /** The PointLight so GSAP can animate its position. */
  const lightRef = useRef<PointLight>(null!);

  /** Reference to the replaced Metal MeshStandardMaterial. */
  const metalMatRef = useRef<MeshStandardMaterial | null>(null);
  const displayScreen = useRef<Object3D | null>(null);
  const displayScreenMatRef = useRef<MeshStandardMaterial | null>(null);
  const displayScreenMeshRef = useRef<BufferGeometry | null>(null);
  const isResetting = useRef(false);
  const interactingValue = useMotionValue(false);
  // ─── Material setup, disk ref, video texture ────────────────────────────────
  useEffect(() => {
    if (!scene) return;

    scene.receiveShadow = true;
    scene.castShadow = true;
    scene.position.set(0, 0, 0);
    scene.rotation.y = INIT_ROT_Y;

    // Locate the Disk mesh for the animation loop
    diskRef.current = scene.getObjectByName("Disk") ?? null;
    playButtonRef.current = scene.getObjectByName("PLAY") ?? null;
    pauseButtonRef.current = scene.getObjectByName("PAUSE") ?? null;
    forwardButtonRef.current = scene.getObjectByName("FORWARD") ?? null;
    rewindButtonRef.current = scene.getObjectByName("REWIND") ?? null;
    let metalMate: MeshStandardMaterial | null = null;
    scene.traverse((obj) => {
      if (!(obj instanceof Mesh) || !obj.material) return;
      const mat = obj.material as Material & { name?: string };

      // ── Display mesh — video texture as emissive map ─────────────────────
      if (mat.name === "Display") {
        displayScreen.current = obj;
        const video = document.createElement("video");
        video.src = VIDEO_URL;
        video.crossOrigin = "anonymous";
        video.loop = true;
        video.muted = true;
        video.playsInline = true;

        const videoTex = new VideoTexture(video);
        videoTex.minFilter = LinearFilter;
        videoTex.magFilter = LinearFilter;
        videoTex.format = RGBAFormat;
        videoTex.flipY = false;

        const displayMat = obj.material as MeshStandardMaterial;

        // 0x96F7FF decoded from original decimal literal 9893887
        displayMat.emissive = new Color(0x96f7ff);
        displayMat.emissiveIntensity = 200;
        displayScreenMatRef.current = displayMat;
        displayScreenMeshRef.current = obj.geometry;
        displayMat.emissiveMap = videoTex;
        displayMat.needsUpdate = true;

        // Attempt autoplay after a short delay (mirrors original 2 s setTimeout)
        setTimeout(() => {
          video.play().catch(() => {
            // Autoplay may be blocked on mobile until user gesture
          });
        }, 2000);
      }

      // ── black_glass — MeshPhysicalMaterial with transmission ─────────────
      // No explicit envMap: scene.environment is picked up automatically.
      if (mat.name === "black_glass") {
        obj.material = new MeshPhysicalMaterial({
          color: "#111111",
          metalness: 0,
          roughness: 0,
          transmission: 1,
          ior: 1.3,
          thickness: 0.3,
          transparent: false
        });
        obj.material.needsUpdate = true;
      }

      // ── Black — plain MeshStandardMaterial ───────────────────────────────
      if (mat.name === "Black") {
        obj.material = new MeshStandardMaterial({
          color: "#1c1c1c",
          metalness: 0,
          roughness: 1
        });
        obj.material.needsUpdate = true;
      }

      // ── Metal — polished material with normal map from original ──────────
      // No explicit envMap: scene.environment is picked up automatically.
      if (mat.name.startsWith("Metal")) {
        if (mat.name === "Metal") {
          metalMate = obj.material as MeshStandardMaterial;

          const metalMat = new MeshStandardMaterial({
            color: "#EBEFF4",
            metalness: 0.85,
            roughness: 0.2,
            envMapIntensity: 0.1,
            normalMap: metalMate.normalMap,
            normalScale: metalMate.normalScale?.clone()
          });
          metalMat.normalScale?.set(0.5, 0.5);
          metalMat.needsUpdate = true;
          metalMatRef.current = metalMat;
          obj.material = metalMat;
        } else if (metalMatRef.current) {
          obj.material = metalMatRef.current;
        }
      }
    });
  }, [scene]);
  const lastResize = useWindowResize({ debounce: 100 });
  // ─── Responsive model scale ───────────────────────────────────────────────
  const onResize = useEffectEvent(() => {
    if (!scene) return;

    // < 991 px → 0.5 scale (mobile + tablet), ≥ 992 px → 0.6
    const s = window.innerWidth < 991 ? 0.5 : 0.6;
    scene.scale.set(s, s, s);
  });
  useEffect(() => {
    onResize();
  }, [lastResize]);
  const trackStatus = useRadioStore(useShallow((r) => r.trackStatus));
  const lastTrackstatus = useRef(trackStatus);
  const seeking = useRadioStore(useShallow((r) => r.seeking));

  const lastActive = useRef(activeButtonRef.current);

  useEffect(() => {
    let state = trackStatus;
    if (seeking) {
      state = "seeking";
    }
    if (state !== lastTrackstatus.current) {
      lastActive.current = activeButtonRef.current;
      const fwdb = forwardButtonRef.current,
        playb = playButtonRef.current,
        pauseb = pauseButtonRef.current,
        rewb = rewindButtonRef.current;
      switch (state) {
        case "seeking":
          activeButtonRef.current = fwdb;
          break;
        case "playing":
          activeButtonRef.current = playb;
          break;
        case "paused":
        case "stopped":
          activeButtonRef.current = pauseb;
          break;
        case "ended":
          activeButtonRef.current = lastActive.current;
          break;
        default:
          activeButtonRef.current = null;
          break;
      }
      [fwdb, playb, pauseb, rewb]
        .filter((r) => r !== null)
        .forEach((v) => {
          const isActive = v === activeButtonRef.current;
          if (isActive) {
            gsap.to(v.rotation, {
              y: 0.08,
              duration: 0.3,
              delay: 0.05,
              ease: "back.out(1.7)" // Built-in tactile mechanical click!
            });
          } else {
            gsap.to(v.rotation, {
              y: 0,
              duration: 0.25,
              ease: "expo.out"
            });
          }
        });
    }
    lastTrackstatus.current = state;
  }, [seeking, trackStatus]);
  // ─── GSAP ScrollTrigger animations ───────────────────────────────────────
  const createScrollTrigger = useEffectEvent(() => {
    if (!scene || !lightRef.current) return;
    const light = lightRef.current;
    const metalMat = metalMatRef.current;
    const triggerSelector = `#${scrollTriggerId}`;

    // 1. Model rotation.y and position.y over scroll
    const modelST = ScrollTrigger.create({
      trigger: triggerSelector,
      start: "top center+=50%",
      end: "bottom center-=50%",
      scrub: true,
      onUpdate: (self) => {
        scene.rotation.y = INIT_ROT_Y + self.progress * ((2 * Math.PI) / 6);
        scene.position.y = INIT_POS_Y + self.progress * 0.6;
      }
    });

    // 2. PointLight position animation (x:-0.5, y:-0.5 — duplicate x key fixed)
    const lightAnim = gsap.to(light.position, {
      x: -0.5,
      y: -0.5,
      ease: "none"
    });
    const lightST = ScrollTrigger.create({
      trigger: triggerSelector,
      start: "top bottom-=20%",
      end: "bottom top+=0%",
      scrub: true,
      animation: lightAnim
    });

    // 3. Metal material envMapIntensity 0.1 → 3
    let metalST: ScrollTrigger | null = null;
    let metalAnim: gsap.core.Tween | null = null;
    if (metalMat) {
      metalAnim = gsap.to(metalMat, {
        envMapIntensity: 3,
        ease: "none",
        onUpdate: () => {
          metalMat.needsUpdate = true;
        }
      });
      metalST = ScrollTrigger.create({
        trigger: triggerSelector,
        start: "top bottom-=20%",
        end: "bottom top+=0%",
        scrub: true,
        animation: metalAnim
      });
    }

    return () => {
      modelST.kill();
      lightST.kill();
      lightAnim.kill();
      metalST?.kill();
      metalAnim?.kill();
    };
  });
  useEffect(() => {
    const onsc = createScrollTrigger();
    return () => onsc && onsc();
  }, [scrollTriggerId]);
  const db = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onInteract = useCallback(() => {
    db.current && clearTimeout(db.current);
    interactingValue.set(true);
    db.current = setTimeout(() => {
      interactingValue.set(false);
    }, 250);
  }, [interactingValue]);
  const lastV = useRef(interactingValue.get());
  interactingValue.on("change", (v) => {
    if (lastV.current !== v) {
      lastV.current = v;
      if (!v) {
        db.current && clearTimeout(db.current);
        isResetting.current = true;
      }
    }
  });

  // ─── Lenis scroll velocity → disk rotation ────────────────────────────────
  // Mirrors: Mi.on('scroll', ({ velocity }) => { hg = -velocity * 0.005 })
  useLenis(({ velocity }) => {
    scrollVelocityRef.current = -velocity * 0.005;
  });
  const lastRotation = useRef(activeButtonRef.current?.rotation.z ?? 0);
  // ─── Animation loop ───────────────────────────────────────────────────────
  // Mirrors the requestAnimationFrame loop (dg) from the original.
  useFrame((state, delta) => {
    // Pause rendering when tab is hidden (mirrors Gl / document.hidden check)
    if (document.hidden) return;

    if (diskRef.current) {
      const isPlaying = lastTrackstatus.current === "playing";

      // Exponential smoothing: qc += (hg - qc) * 0.1
      smoothedVelocityRef.current +=
        (scrollVelocityRef.current - smoothedVelocityRef.current) *
        (isPlaying ? 0.17 : 0.1);
      diskRef.current.rotation.y +=
        BASE_DISK_SPEED + smoothedVelocityRef.current;
    }
    if (isResetting.current) {
      state.camera.position.lerp(INITIAL_CAMERA_POS, delta * 5);
      controlsRef.current.target.lerp(INITIAL_TARGET_POS, delta * 5);
      controlsRef.current.update();

      const distToCam = state.camera.position.distanceTo(INITIAL_CAMERA_POS);
      const distToTarget =
        controlsRef.current.target.distanceTo(INITIAL_TARGET_POS);

      if (distToCam < 0.01 && distToTarget < 0.01) {
        // 4. Mutate the ref to stop the loop. Again, no re-render!
        isResetting.current = false;
      }
    }
  });

  return (
    <>
      {/* Configures ACESFilmic tone mapping etc. on the shared renderer. */}
      <TapeRendererSetup />

      {/*
       * PerspectiveCamera — fov=10, position=(-8,-3,15).
       * makeDefault={inView} activates this camera only while the
       * container div is in the viewport; other Views use their own cameras.
       * OrbitControls defaults to target=(0,0,0), handling lookAt implicitly.
       */}
      <PerspectiveCamera
        makeDefault={inView}
        fov={10}
        position={INITIAL_CAMERA_POS}
        near={0.1}
        far={100}
      />
      <OrbitControls
        onChange={onInteract}
        enableDamping
        enabled={inView}
        ref={controlsRef}
        enableZoom={false}
      />

      {/*
       * Tilt group — replaces lr.rotation.set(.1, 0, 0) from the original.
       * Cannot rotate the shared R3F scene, so we wrap content in a group.
       */}
      <group rotation={[0.1, 0, 0]}>
        {/*
         * HDR environment lighting.
         * background={false} keeps the env map for lighting only (no skybox).
         * scene.environment is set automatically; materials without an
         * explicit envMap will pick it up from there.
         */}
        <Environment files={HDR_URL} background={false} />

        {/*
         * PointLight — original: new J_(0xFF7829, 50, 3.5, 3.6)
         * GSAP ScrollTrigger animates position.x and position.y.
         */}
        <pointLight
          ref={lightRef}
          color={"#ff7829"}
          intensity={50}
          distance={3.5}
          decay={3.6}
          position={[-2, -1.3, 2]}
          castShadow
        />

        {/* The GLTF model — materials are overridden in useEffect above */}
        <primitive object={scene}>
          <mesh {...displayScreenMeshRef.current}>
            <meshStandardMaterial {...displayScreenMatRef.current}>
              <RenderTexture attach="emissiveMap">
                <Text font={}></Text>
              </RenderTexture>
            </meshStandardMaterial>
            <bufferGeometry {...displayScreenMeshRef.current} />
          </mesh>
        </primitive>
      </group>
    </>
  );
}
