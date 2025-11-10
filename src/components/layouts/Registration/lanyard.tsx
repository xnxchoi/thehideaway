"use client";
import { Plaque } from "@/components/layouts/Registration/MembershipBadge";
import { useIsMobile } from "@/providers/MiddleMan";
import {
  Environment,
  Loader,
  PerspectiveCamera,
  View
} from "@react-three/drei";

import { Physics } from "@react-three/rapier";
import { useFormContext } from "react-hook-form";
import { useInView } from "react-intersection-observer";

export type MemberCardsType = "BADGE" | "PLATE";

export function Lanyard(props: { type: MemberCardsType | string }) {
  const { type } = props;
  return (
    <>
      <Registerer type={type} />
      <Loader
        barStyles={{
          backgroundColor: "oklch(54.74% 0.2224 29.01/.5)",
          borderRadius: "1px"
        }}
        containerStyles={{
          transition: "all 0.5s ease",
          zIndex: 247,
          backgroundColor: "rgba(0,0,0,.1)",
          backdropFilter: "blur(4px)",
          borderRadius: "10px",
          padding: "10px",
          position: "absolute"
        }}
      />
    </>
  );
}

function Registerer(
  props: {
    type: MemberCardsType | string;
  } = { type: "BADGE" as MemberCardsType }
) {
  const { type } = props;
  const { isMobile, isTouch } = useIsMobile();

  const isMouse = !isMobile && !isTouch;
  const { watch } = useFormContext();
  const { inView, ref } = useInView();
  const [name1, name2] = watch(["firstName", "lastName"]);
  return (
    <div ref={ref} className="relative h-full w-full">
      <View
        style={{
          right: "0",
          top: "0",
          bottom: "0",
          position: "absolute",
          left: "0"
        }}
      >
        <PerspectiveCamera
          position={[0, 0, 13]}
          fov={type === "BADGE" ? 25 : 35}
          makeDefault={inView}
        />
        <ambientLight intensity={Math.PI} />
        {(type === "BADGE" && (
          <Physics
            debug={false}
            interpolate={true}
            gravity={[0, -40, 0]}
            timeStep={1 / 60}
          >
            <Plaque name1={name1} name2={name2} />
          </Physics>
        )) || <></>}
        <Environment
          files={["env_hdr1-gainmap.webp", "env_hdr1.json", "env_hdr1.webp"]}
          path={"/assets/rp_plaque/"}
        ></Environment>
      </View>
    </div>
  );
}
