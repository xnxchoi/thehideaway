import { ReactNode, useRef } from "react";

import { OrthographicCamera, View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { PerformanceRegress } from "../UX/Gradient/Gradient";
import { Linus } from "../UX/Scroll";
import { useShallow } from "zustand/shallow";
import { useRPStore } from "@/providers/RP_Pro";

export const Main = ({ children }: { children: ReactNode }) => {
  const mainRef = useRef<HTMLElement>(null!);
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  return (
    <main ref={mainRef} className={"root"}>
      {children}
      <Canvas
        performance={{ min: 0.2 }}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: navIsOpen ? 120 : 40,
          width: "100vw",
          height: "100vh"
        }}
        gl={{
          premultipliedAlpha: false,
          alpha: true,
          antialias: false
        }}
        className="preview__gradient"
        eventSource={mainRef}
      >
        <OrthographicCamera makeDefault position={[0, 0, 1]} />
        <View.Port />
        <PerformanceRegress />
      </Canvas>
      <Linus root={true} />
    </main>
  );
};
