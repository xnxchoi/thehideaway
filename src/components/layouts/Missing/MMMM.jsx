"use client";
import * as THREE from "three";
import { CanvasTexture } from "three";
import fragmentShader from "@/components/Missing/shader/fragment.glsl";
import vertexShader from "@/components/Missing/shader/vertex.glsl";

import gsap from "gsap";
import { useCallback, useEffect, useRef } from "react";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import {
  OrthographicCamera,
  shaderMaterial,
  useTexture
} from "@react-three/drei";

export function MX() {
  return (
    <Canvas>
      <OrthographicCamera
        makeDefault={true}
        position={[0, 0, 1]}
        left={-1}
        right={1}
        top={1}
        bottom={-1}
        near={0.1}
        far={1000}
      />
      <XO />
    </Canvas>
  );
}

const canvasTexture = () => {
  const vPixelRatio = window.devicePixelRatio;
  const canvasRef = document.createElement("canvas"),
    ctxRef = canvasRef.getContext("2d", { alpha: true });
  ((canvasRef.width = window.innerWidth / vPixelRatio),
    (canvasRef.height = window.innerHeight / vPixelRatio));
  let ctx = ctxRef;
  ctx.clearRect(0, 0, canvasRef.width, canvasRef.height);
  ctx.globalAlpha = 1;

  let d =
    "m0 1098.61.14-258.06c42.73-65 82.1-132.06 118.11-201.13 35.99-69.07 68.06-138.46 96.2-208.22 28.12-69.76 52.89-138.84 74.27-207.26 21.38-68.39 39.4-135.12 54.07-200.14l345.56.18-.72 1343.24-207.34-.11.61-1152.22h-11.81c-21.39 85.34-46.45 166.94-75.14 244.83-28.7 77.9-60.22 151.7-94.52 221.46S228.86 816.26 190.62 877.2v16.27l620.32.33-.11 205.24zm1430.98 297.45c-64.06-.03-119.96-15.99-167.7-47.84s-87.35-77.93-118.78-138.24c-31.43-60.29-54.72-132.8-69.84-217.48s-22.65-179.84-22.59-285.54c.08-155.77 14.74-286.15 44.03-391.15 29.28-104.99 72.31-183.88 129.08-236.68 56.76-52.78 127.3-79.17 211.6-79.13 85.4.05 156.19 27.18 212.36 81.4 56.15 54.22 98.25 133.48 126.29 237.82 28.03 104.34 42.03 231.7 41.95 382.05-.06 107.04-7.97 203.57-23.75 289.58-15.78 86.04-39.7 159.18-71.76 219.43-32.06 60.28-72.27 106.32-120.61 138.12-48.35 31.8-105.1 47.69-170.28 47.66m3.48-203.2c25.85.01 49.45-8.77 70.82-26.37 21.35-17.6 39.35-46.04 53.98-85.33 14.61-39.27 26.16-90.39 34.63-153.4 8.45-62.99 12.72-139.2 12.76-228.63.06-107.02-6.36-197.11-19.24-270.27-12.89-73.16-32.23-129.06-58.06-167.69s-57.85-57.95-96.06-57.97c-32.6-.02-61.81 15.89-87.68 47.7q-38.805 47.76-59.94 156.45c-14.08 72.46-21.15 170.34-21.21 293.62-.05 89.43 3.83 165.3 11.67 227.64 7.83 62.33 19.04 112.78 33.64 151.4 14.57 38.62 32.54 67.07 53.89 85.36 21.33 18.31 44.94 27.46 70.79 27.48Zm622.05-93.16.14-258.06c42.73-65 82.1-132.06 118.11-201.13 35.99-69.07 68.06-138.46 96.2-208.22 28.12-69.76 52.89-138.84 74.27-207.26 21.38-68.39 39.4-135.12 54.07-200.14l345.56.18-.72 1343.24-207.34-.11.61-1152.22h-11.81c-21.39 85.34-46.45 166.94-75.14 244.83-28.7 77.9-60.22 151.7-94.52 221.46s-70.57 135.08-108.81 196.02v16.27l620.32.33-.11 205.24z";
  let path = new Path2D(d);
  let viewBox = "0 0 2867.45 1396.06".split(" ");
  gsap.to("#svgel", { autoAlpha: 0, duration: 1, ease: "power4.inOut" });
  let m = parseFloat(viewBox[2]),
    g = parseFloat(viewBox[3]),
    _ = canvasRef.width / m,
    v = canvasRef.height / g,
    y = Math.min(_, v);
  let fillstyle = "rgb(255, 255, 255)";
  (ctx.setTransform(y, 0, 0, y, 0, 0),
    ctx.translate(
      (canvasRef.width - m * y) / 2,
      (canvasRef.height - g * y) / 2
    ),
    (ctx.fillStyle = fillstyle),
    ctx.fill(path));
  let txt = new THREE.CanvasTexture(canvasRef);
  ((txt.width = canvasRef.width / vPixelRatio),
    (txt.height = canvasRef.height / vPixelRatio));
  return txt;
};
const SvgSdfShader = shaderMaterial(
  {
    u_resolution: new THREE.Vector2(1, 1),
    u_mouse: new THREE.Vector2(0, 0),
    canvasTexture: new CanvasTexture(),
    u_pixelRatio: 1,
    u_pxRange: 3,
    u_alpha: 1.0,
    u_time: 0.0,
    u_direction: 0
  },
  vertexShader,
  fragmentShader
);
SvgSdfShader.defines = {
  VAR: 45
};
extend({ SvgSdfShader });

function XO() {
  const { gl, scene, camera } = useThree();
  const canvasTexture = useTexture();
  const variation = useRef(45);
  const mesh = useRef();
  const vMouseDamp = new THREE.Vector2(0, 0);
  const vMouse = new THREE.Vector2(0, 0);

  const material = useRef();
  const onPointerMove = useCallback((e) => {
    vMouse.set(
      -window.innerWidth + e.pageX * 2,
      window.innerHeight - 2 * e.pageY
    );
  }, []);
  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove, false);

    return () => {
      window.removeEventListener("mousemove", onPointerMove, false);
    };
  }, [onPointerMove]);

  let did = false;
  useFrame(({ state, delta }) => {
    if (!did) {
      console.log(mesh.current);
      did = true;
    }
    for (const k in vMouse) {
      THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 2, delta);
    }
    material.current.u_time += delta;
  });

  return (
    <group>
      <mesh ref={mesh}>
        <planeGeometry attach="geometry" args={[1, 1]} />
        <svgSdfShader
          ref={material}
          attach="material"
          u_mouse={vMouseDamp}
          canvasTexture={canvasTexture()}
        />
      </mesh>
    </group>
  );
}

export function MMM() {
  // extract "variation" parameter from the url
  const variation = 45;

  // Scene setup
  const removes = [];
  const initiate = () => {
    const scene = new THREE.Scene();

    // Viewport setup (updated on resize)
    let w,
      h = 1;

    const aspect = w / h;
    let dpr = 2;
    const camera = new THREE.OrthographicCamera(
      -aspect,
      aspect,
      1,
      -1,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({});

    // Plane geometry covering the full viewport
    const group = new THREE.Group();

    const geo = new THREE.PlaneGeometry(1, 1); // Scaled to cover full viewport
    const vPixelRatio = window.devicePixelRatio;
    console.log(vPixelRatio);
    const uniforms = {
      u_resolution: { value: vResolution },
      u_mouse: { value: vMouseDamp },
      u_pixelRatio: { value: vPixelRatio }
    };

    scene.add(group);
    // Camera position and orientation
    camera.position.z = 100; // Set appropriately for orthographic
    // Animation loop to render
    let time,
      lastTime = 0;
    let interval = 450;
    let rafID = 0;
    const update = () => {
      // calculate delta time
      time = performance.now() * 0.001;
      const dt = time - lastTime;

      lastTime = time;

      // ease mouse motion with damping
      for (const k in vMouse) {
        if (k == "x" || k == "y")
          vMouseDamp[k] = THREE.MathUtils.damp(vMouseDamp[k], vMouse[k], 1, dt);
      }
      renderer.render(scene, camera);
      rafID = requestAnimationFrame(update);
    };

    const onPointerMove = (e) => {
      vMouse.set(
        -window.innerWidth + e.clientX * 2,
        window.innerHeight - 2 * e.clientY
      );
    };

    const resize = (callbacks = []) => {
      w = window.innerWidth;
      h = window.innerHeight;

      dpr = Math.min(window.devicePixelRatio, 2);

      renderer.setSize(w, h);
      renderer.setPixelRatio(dpr);

      camera.left = -w / 2;
      camera.right = w / 2;
      camera.top = h * 0.65;
      camera.bottom = -h * 0.65;
      camera.updateProjectionMatrix();

      vResolution.set(w, h).multiplyScalar(dpr);

      uniforms.u_resolution.value = vResolution;
      callbacks.forEach((cb) => cb());
    };

    let init = (canvas) => {
      canvas.appendChild(renderer.domElement);

      // Orthographic camera setup

      // shader material creation
      let domRect = canvass.getBoundingClientRect();
      const bounds = {
        width: domRect.width * vPixelRatio,
        height: domRect.height * vPixelRatio,
        top: domRect.top * vPixelRatio,
        left: domRect.left * vPixelRatio
      };
      let scales = { x: w, y: h };
      const parentWidth = bounds.width * scales.x;
      const parentHeight = bounds.height * scales.y;

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader, // most of the action happening in the fragment
        transparent: true,
        opacity: 1,
        uniforms: {
          uTime: { type: "1f", value: 0 },
          uIntensity: { type: "2f", value: [0, 0] },
          uDirection: { type: "1f", value: 0 },
          u_mouse: { value: vMouseDamp },
          u_resolution: { value: vResolution },
          u_pixelRatio: { value: vPixelRatio },
          u_pxRange: { value: 3 },
          u_alpha: { value: 1 },
          canvasTexture: { type: "t", value: txttr }
        },
        defines: {
          VAR: variation
        }
      });

      // Mesh creation
      const quad = new THREE.Mesh(geo, mat);
      quad.position.set(0, 0, 1);

      group.add(quad);
      const sce = () => {
        (quad.geometry.dispose(),
          quad.material.dispose(),
          mat.dispose(),
          txttr.dispose());
        scene.remove(group, camera);
      };
      removes.push(sce);
      resize([
        () => (mat.uniforms.u_pixelRatio.value = dpr),
        () => quad.scale.set(w, h, 1)
      ]);
      update();
      document.addEventListener("mousemove", onPointerMove);
      document.addEventListener("pointermove", onPointerMove);
      document.body.addEventListener(
        "touchmove",
        function (e) {
          e.preventDefault();
        },
        { passive: false }
      );
      window.addEventListener("resize", resize);
      gsap.to(svgEl, {
        autoAlpha: 0,
        duration: 1,
        ease: "power4.inOut",
        onStart: () => {
          update();
        }
      });
    };

    const remover = () => {
        // console.log("removing");
      document.removeEventListener("mousemove", onPointerMove);
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("transitioningnow", remover);
      removes.forEach((r) => r());
      renderer.domElement.remove();
      renderer.dispose();
      geo.dispose();
      cancelAnimationFrame(rafID);
    };

    return { init, remover };
  };
  return initiate;
}
