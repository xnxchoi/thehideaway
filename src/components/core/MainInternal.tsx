import { PerformanceRegress } from "@/components/UX/Gradient/Gradient";
import { cn } from "@/lib/utils";
import { OrthographicCamera, View } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { ComponentProps } from "react";

export function MainInternal({
  style,
  className,
  children,
  gl,
  eventSource: mainRef,
  ...props
}: ComponentProps<typeof Canvas>) {
  return (
    <Canvas
      performance={{ min: 0.2 }}
      style={style}
      gl={{
        premultipliedAlpha: false,
        alpha: true,

        ...gl
      }}
      className={cn("preview__gradient", className)}
      eventSource={mainRef}
      {...props}
    >
      {children}
      <OrthographicCamera makeDefault position={[0, 0, 1]} />
      <View.Port />
      <PerformanceRegress />
    </Canvas>
  );
}
