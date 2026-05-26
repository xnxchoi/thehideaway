"use client";
import "lenis/dist/lenis.css";
import {
  LenisProps as ReactLenisProps,
  ReactLenis,
  useLenis
} from "lenis/react";
import { useEffect } from "react";
import { useTempus } from "tempus/react";
import { LenisOptions } from "lenis";
import { setRootLenis } from "@/lib/lenis/runtime";

interface LenisProps extends Omit<ReactLenisProps, "ref"> {
  root: boolean;
  options?: LenisOptions;
}

function LenisRuntime({ root }: { root: boolean }) {
  const lenis = useLenis();
  useTempus((time) => {
    if (lenis) {
      lenis.raf(time);
    }
  });

  useEffect(() => {
    if (!root || !lenis) return undefined;

    setRootLenis(lenis);

    return () => {
      setRootLenis(null);
    };
  }, [lenis, root]);

  return null;
}

export function Linus({ root, options }: LenisProps) {
  return (
    <ReactLenis
      root={root}
      options={{
        ...options,
        autoRaf: false,
        anchors: true
      }}
    >
      <LenisRuntime root={root} />
    </ReactLenis>
  );
}
