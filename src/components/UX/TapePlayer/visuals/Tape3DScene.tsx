"use client";
import { cn } from "@/lib/utils";
import { View } from "@react-three/drei";
import { type ComponentProps, Suspense, useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { TapeModel } from "./TapeModel";

interface Tape3DSceneProps {
  /**
   * The DOM element id used as the GSAP ScrollTrigger trigger.
   * The element should exist in the page at or near where the 3D model
   * is visible. Defaults to "webgl_trigger".
   */
  scrollTriggerId?: string;
  className?: string;
  style?: ComponentProps<"div">["style"];
}

/**
 * Responsive aspect ratios matching the original tape3d.js breakpoints:
 *   < 480px  → 9:16 (portrait mobile)
 *   480–991px → 1:1  (tablet)
 *   ≥ 992px  → 16:9 (desktop)
 */
function useResponsiveAspectRatio() {
  const [ratio, setRatio] = useState("16 / 9");

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setRatio("9 / 16");
      else if (w <= 991) setRatio("1 / 1");
      else setRatio("16 / 9");
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return ratio;
}

/**
 * Renders the tape player 3D model into the project's shared Canvas
 * (MainInternal) via drei's View system.
 *
 * The container div controls the responsive aspect ratio; the View
 * fills it with `position: absolute, inset: 0`. Visibility is tracked
 * via useInView so the PerspectiveCamera inside only becomes the
 * default camera while the component is on-screen.
 */
export function Tape3DScene({
  scrollTriggerId = "webgl_trigger",
  className,
  style
}: Tape3DSceneProps) {
  const aspectRatio = useResponsiveAspectRatio();
  const { ref, inView } = useInView({ threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn("relative h-screen w-full")}
      style={{ aspectRatio, ...style }}
    >
      <View
        className={cn(
          "absolute inset-[auto_0%_.5%] h-screen w-full",
          className
        )}
      >
        <Suspense fallback={null}>
          <TapeModel scrollTriggerId={scrollTriggerId} inView={inView} />
        </Suspense>
      </View>
    </div>
  );
}
