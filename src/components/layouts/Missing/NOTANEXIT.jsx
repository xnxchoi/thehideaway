"use client";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from "react";
import gsap from "gsap/all";
import * as THREE from "three";
import vertexShader from "@/components/layouts/Missing/shader/vertex.glsl";
import fragmentShader from "@/components/layouts/Missing/shader/fragment.glsl";
import { OrthographicCamera, shaderMaterial } from "@react-three/drei";
import { useRPStore } from "@/providers/RP_Pro.js";
import { useWindowResize } from "../../../utilities/use_window_resize.js";
import { useShallow } from "zustand/shallow";

function drawSVG(ctx, canvasWidth, canvasHeight) {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  ctx.globalAlpha = 1;
  const svgEl = document.getElementById("svgel");
  let d =
    (svgEl && svgEl.querySelector("path").getAttribute("d")) ||
    "m0 1098.61.14-258.06c42.73-65 82.1-132.06 118.11-201.13 35.99-69.07 68.06-138.46 96.2-208.22 28.12-69.76 52.89-138.84 74.27-207.26 21.38-68.39 39.4-135.12 54.07-200.14l345.56.18-.72 1343.24-207.34-.11.61-1152.22h-11.81c-21.39 85.34-46.45 166.94-75.14 244.83-28.7 77.9-60.22 151.7-94.52 221.46S228.86 816.26 190.62 877.2v16.27l620.32.33-.11 205.24zm1430.98 297.45c-64.06-.03-119.96-15.99-167.7-47.84s-87.35-77.93-118.78-138.24c-31.43-60.29-54.72-132.8-69.84-217.48s-22.65-179.84-22.59-285.54c.08-155.77 14.74-286.15 44.03-391.15 29.28-104.99 72.31-183.88 129.08-236.68 56.76-52.78 127.3-79.17 211.6-79.13 85.4.05 156.19 27.18 212.36 81.4 56.15 54.22 98.25 133.48 126.29 237.82 28.03 104.34 42.03 231.7 41.95 382.05-.06 107.04-7.97 203.57-23.75 289.58-15.78 86.04-39.7 159.18-71.76 219.43-32.06 60.28-72.27 106.32-120.61 138.12-48.35 31.8-105.1 47.69-170.28 47.66m3.48-203.2c25.85.01 49.45-8.77 70.82-26.37 21.35-17.6 39.35-46.04 53.98-85.33 14.61-39.27 26.16-90.39 34.63-153.4 8.45-62.99 12.72-139.2 12.76-228.63.06-107.02-6.36-197.11-19.24-270.27-12.89-73.16-32.23-129.06-58.06-167.69s-57.85-57.95-96.06-57.97c-32.6-.02-61.81 15.89-87.68 47.7q-38.805 47.76-59.94 156.45c-14.08 72.46-21.15 170.34-21.21 293.62-.05 89.43 3.83 165.3 11.67 227.64 7.83 62.33 19.04 112.78 33.64 151.4 14.57 38.62 32.54 67.07 53.89 85.36 21.33 18.31 44.94 27.46 70.79 27.48Zm622.05-93.16.14-258.06c42.73-65 82.1-132.06 118.11-201.13 35.99-69.07 68.06-138.46 96.2-208.22 28.12-69.76 52.89-138.84 74.27-207.26 21.38-68.39 39.4-135.12 54.07-200.14l345.56.18-.72 1343.24-207.34-.11.61-1152.22h-11.81c-21.39 85.34-46.45 166.94-75.14 244.83-28.7 77.9-60.22 151.7-94.52 221.46s-70.57 135.08-108.81 196.02v16.27l620.32.33-.11 205.24z";
  let path = new Path2D(d);
  let viewBox = svgEl.getAttribute("viewBox").split(" ");
  let m = parseFloat(viewBox[2]),
    g = parseFloat(viewBox[3]),
    _ = canvasWidth / m,
    v = canvasHeight / g,
    y = Math.min(_, v);
  let fillstyle = gsap.getProperty("html", "--red-t-1");
  (ctx.setTransform(y, 0, 0, y, 0, 0),
    ctx.translate((canvasWidth - m * y) / 2, (canvasHeight - g * y) / 2),
    (ctx.fillStyle = fillstyle),
    ctx.fill(path));
}

function canvasser(canvasHeight, canvasWidth) {}

export const NOTANEXIT = ({ ref, style }) => {
  return (
    <Canvas ref={ref} style={style}>
      <OrthographicCamera
        makeDefault={true}
        near={0.1}
        far={1000}
        left={-2}
        right={2}
        top={1}
        bottom={-1}
      />
      <EXIT />
    </Canvas>
  );
};

const EXIT = () => {
  const { camera, gl } = useThree();
  const canvas = useMemo(() => gl.domElement, [gl]);
  const vMouse = useRef(new THREE.Vector2(0, 0));
  const [vPixelRatio, setVpixelRatio] = useState(2);
  useEffect(() => {
    setVpixelRatio(window.devicePixelRatio || 2);
  }, []);
  const initiateTexture = useEffectEvent(() => {
    let canvass = document.createElement("canvas");
    ((canvass.width = gl.domElement.width),
      (canvass.height = gl.domElement.height));
    let ctx = canvass.getContext("2d", { alpha: true });
    ctx.clearRect(0, 0, canvass.width, canvass.height);
    ctx.globalAlpha = 1;
    const svgEl = document.getElementById("svgel");
    if (!svgEl) {
    }
    let d =
      (svgEl && svgEl.querySelector("path").getAttribute("d")) ||
      "M4.3 228.6h87v19.9H60V332H35.8v-83.6H4.3v-20Zm99.2 0h24.3v41.8h41.7v-41.8h24.3V332h-24.4v-41.9h-41.6v42h-24.3V228.5Zm130.3 103.5h-24.3V228.6h24.3V332Zm67.1-81.6c-2.8-2.1-6.6-3.2-11.6-3.2s-8.5 1-11.1 2.9a9 9 0 0 0-4 7.4c0 3 1.4 5.3 4 7.1a34 34 0 0 0 11.5 4.4l9 2.1a51 51 0 0 1 23.5 11 26.2 26.2 0 0 1 8.1 19.9c0 6.5-1.7 12-5 16.8a31 31 0 0 1-14 10.9c-6.1 2.5-13.5 3.7-22 3.7s-16.2-1.3-22.6-4a32.2 32.2 0 0 1-14.8-11.8 35.8 35.8 0 0 1-5.5-19.6h23.4c.3 4.9 2.2 8.6 5.6 11.2 3.4 2.6 8 4 13.6 4 5 0 9-1 12-3.1 3-2 4.5-4.8 4.6-8.1 0-3-1.4-5.3-4.1-7a41 41 0 0 0-12.8-4.7l-10.9-2.6c-19.1-4.4-28.7-14-28.7-28.6 0-6.3 1.7-11.9 5.1-16.7 3.5-4.9 8.3-8.7 14.4-11.3 6-2.7 13-4 20.8-4s14.8 1.3 20.7 4a30.3 30.3 0 0 1 18.8 28.1h-23.5c-.3-3.8-1.8-6.7-4.6-8.8Zm99.1 81.6h-24.3V228.6H400V332Zm67-81.6c-2.7-2.1-6.6-3.2-11.5-3.2s-8.5 1-11.1 2.9a9 9 0 0 0-4 7.4c0 3 1.4 5.3 4 7.1a34 34 0 0 0 11.5 4.4l9 2.1c10.2 2.3 18 6 23.4 11a26.2 26.2 0 0 1 8.2 19.9 28.7 28.7 0 0 1-19 27.7c-6 2.6-13.5 3.7-22 3.7s-16.2-1.3-22.6-4a32.2 32.2 0 0 1-14.8-11.8 35.8 35.8 0 0 1-5.5-19.6H436c.3 4.9 2.1 8.6 5.5 11.2 3.5 2.6 8 4 13.7 4 5 0 9-1 12-3.1 3-2 4.5-4.8 4.6-8.1-.1-3-1.5-5.3-4.1-7a41 41 0 0 0-12.8-4.7l-10.9-2.6c-19.2-4.4-28.7-14-28.7-28.6 0-6.3 1.6-11.9 5-16.7 3.5-4.9 8.3-8.7 14.4-11.3 6.2-2.7 13.1-4 20.9-4s14.7 1.3 20.6 4a30.3 30.3 0 0 1 18.8 28.1h-23.4c-.3-3.8-1.8-6.7-4.6-8.8Zm162.6 81.6H609l-42-60.8h-.7v60.8h-24.4V228.6h21l41.7 60.8h.8v-60.8h24.3V332ZM736 309a44.1 44.1 0 0 1-17.5 18.3c-7.5 4.2-15.9 6.3-25.2 6.3s-17.8-2.1-25.3-6.3a44.4 44.4 0 0 1-17.5-18.3c-4.3-8-6.4-17.6-6.4-28.6s2.1-20.7 6.4-28.7c4.3-8 10.1-14.1 17.5-18.3 7.5-4.1 15.9-6.2 25.3-6.2s17.7 2 25.2 6.2a44.1 44.1 0 0 1 17.6 18.3c4.2 8 6.4 17.6 6.4 28.7S740.3 301 736 309Zm-21.3-46c-2-4.7-4.7-8.3-8.4-10.7-3.6-2.5-8-3.7-13-3.7s-9.4 1.2-13 3.6c-3.7 2.5-6.5 6-8.4 10.9-2 4.7-3 10.5-3 17.2s1 12.6 3 17.4c1.9 4.7 4.7 8.3 8.3 10.8 3.7 2.4 8 3.6 13 3.6s9.5-1.2 13.1-3.6c3.7-2.5 6.5-6 8.4-10.8 2-4.8 2.9-10.6 2.9-17.3s-1-12.6-3-17.3Zm33.9-34.4h87.1v19.9h-31.5V332h-24.1v-83.6h-31.5v-20ZM35.8 612.8l35.1-103.5h32.4l35 103.5H112l-7-22.1H69l-7 22.1H35.7Zm63.4-40.7-11.7-37.2h-.9L75 572.1h24.3Zm137.9 40.7h-20.7l-42-60.7h-.8v60.7h-24.3V509.3h21l41.6 60.8h.9v-60.8H237v103.5Zm48.5-103.5h71.6v19.9H310V551h43.6v20H310v22h47.5v19.9h-71.8V509.3Zm130.8 33.2h.9l19.4-33.2h27.4l-31.4 51.8 32.4 51.8h-28l-19.8-33.5h-.9l-19.7 33.5h-27.9L401 561l-31.5-51.8h27.6l19.3 33.2Zm84.6 70.3h-24.2V509.3H501v103.5Zm12.2-103.5h87.1v19.9H569v83.7h-24.2v-83.7h-31.5v-19.9Z";

    let path = new Path2D(d);
    let viewBox = svgEl.getAttribute("viewBox").split(" ");
    let m = parseFloat(viewBox[2]),
      g = parseFloat(viewBox[3]),
      _ = canvass.width / m,
      v = canvass.height / g,
      y = Math.min(_, v);
    let fillstyle = gsap.getProperty("html", "--red-t-1");
    (ctx.setTransform(y, 0, 0, y, 0, 0),
      ctx.translate((canvass.width - m * y) / 2, (canvass.height - g * y) / 2),
      (ctx.fillStyle = `${fillstyle}`),
      ctx.fill(path));
    let txttr = new THREE.CanvasTexture(canvass);
    let vPixelRatio = window.devicePixelRatio || 2;
    ((txttr.width = canvass.width / vPixelRatio),
      (txttr.height = canvass.height / vPixelRatio));
    gsap.to(svgEl, {
      autoAlpha: 0,
      duration: 1,
      ease: "power4.inOut"
    });
    return txttr;
  });
  const cvt = useMemo(
    () => canvasser(canvas.offsetHeight, canvas.offsetWidth),
    [canvas]
  );
  const uniforms = useMemo(
    () => ({
      uTime: 0.0,
      uIntensity: [0, 0],
      uDirection: 0.0,
      u_mouse: new THREE.Vector2(0, 0),
      u_resolution: new THREE.Vector2(1, 1),
      u_pixelRatio: vPixelRatio,
      u_pxRange: 3,
      u_alpha: 1,
      canvasTexture: cvt
    }),
    [cvt, vPixelRatio]
  );

  useEffect(() => {
    const onPointerMove = (e) => {
      vMouse.current.set(
        -window.innerWidth + e.clientX * 2,
        window.innerHeight - 2 * e.clientY
      );
    };
    const preventDefault = (e) => {
      e.preventDefault();
    };
    document.addEventListener("mousemove", onPointerMove);
    document.addEventListener("pointermove", onPointerMove);
    document.body.addEventListener("touchmove", preventDefault, {
      passive: false
    });

    return () => {
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("pointermove", onPointerMove);
      document.body.removeEventListener("touchmove", preventDefault);
    };
  }, []);
  const ShaderM = shaderMaterial(
    uniforms,
    "" + vertexShader,
    "" + fragmentShader
  );
  extend({ ShaderM });

  const resizer = useWindowResize();
  const mat = useRef(),
    quad = useRef();
  const resize = useEffectEvent(() => {
    return () => {
      if (mat.current && quad.current) {
        let w = window.innerWidth;
        let h = window.innerHeight;

        const dpr = window.devicePixelRatio || 2;
        gl.setSize(w, h);
        gl.setPixelRatio(dpr);
        camera.left = -w / 2;
        camera.right = w / 2;
        camera.top = h / 2;
        camera.bottom = -h / 2;
        camera.updateProjectionMatrix();
        quad.current.scale.set(w, h, 1);
        mat.current.uniforms.u_resolution.value.set(w, h).multiplyScalar(dpr);
        mat.current.uniforms.u_pixelRatio = dpr;
      }
    };
  });
  useEffect(() => {
    resize();
  }, [resizer]);
  useEffect(() => {
    resize();
  }, []);

  useFrame((_, delta) => {
    if (mat.current && mat.current.uniforms) {
      mat.current.uniforms.u_mouse.value = new THREE.Vector2(
        THREE.MathUtils.damp(uniforms.u_mouse.x, vMouse.current.x, 1, delta),
        THREE.MathUtils.damp(uniforms.u_mouse.y, vMouse.current.y, 1, delta)
      );
    }
  });
  const pageIsTransitioning = useRPStore(
      useShallow((l) => l.pageIsTransitioning)
    ),
    transitionOutType = useRPStore(useShallow((l) => l.transitionOutType));
  const lastTimeRef = useRef(false);
  const outset = useEffectEvent(() => {
    if (transitionOutType === "NORMAL") {
      if (!lastTimeRef.current) {
        lastTimeRef.current = true;
      } else {
        uniforms.canvasTexture.dispose();
      }
    }
  });
  useEffect(() => {
    if (pageIsTransitioning) {
      outset();
    }
  }, [pageIsTransitioning]);
  return (
    <group>
      <mesh ref={quad}>
        <planeGeometry args={[1, 1]} position={[0, 0, 1]} />
        <shaderM
          ref={mat}
          transparent={true}
          opacity={1}
          defines={{ VAR: 45 }}
        />
      </mesh>
    </group>
  );
};
