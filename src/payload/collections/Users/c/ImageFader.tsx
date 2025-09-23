import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { Texture, TextureLoader } from "three";
import baseVertex from "@/payload/collections/Users/c/baseVertex.glsl";
import imageFrag from "@/payload/collections/Users/c/imageFaderFrag.glsl";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

type ImageParamsFader = {
  tl: GSAPTimeline;
  loader: TextureLoader | null;
  fade: number;
  src: string;
  tex: Texture;
};
export const ImageFader = () => {
  const tlRef = useRef<GSAPTimeline>(null!);
  const image = useRef<ImageParamsFader>({
    tl: null!,
    loader: null,
    fade: 0,
    src: null!,
    tex: null!
  });
  const _translate = useRef({ x: 0, y: 0 });
  const aspect = useRef({ width: 1, height: 1 });

  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 1, 1), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: baseVertex,
        fragmentShader: imageFrag,
        transparent: !0,
        uniforms: {
          resolution: {
            value: {
              x: 0,
              y: 0
            }
          },
          i_resolution: {
            value: {
              x: aspect.current.width,
              y: aspect.current.height
            }
          },
          borderRadius: {
            value: 0
          },
          fade: {
            value: 0
          },
          opacity: {
            value: 1
          },
          preloadPower: {
            value: 0
          },
          tPoster: {
            value: null
          },
          tPreload: {
            value: null
          },
          tDiffuse: {
            value: null
          }
        }
      }),
    []
  );
  useGSAP(() => {
    tlRef.current = gsap.timeline().to(image.current, {
      fade: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  });
  return <mesh geometry={geometry} material={material} />;
};
