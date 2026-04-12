import type { Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { gsap } from "gsap";
import { useWindowResize } from "@/utilities/use_window_resize";

export type ScrollTriggerLocation =
  | "top bottom"
  | "bottom top"
  | "bottom bottom"
  | "top top"
  | string;

export type InViewOptions = {
  fireOnce?: boolean;
  scrolltriggerStart?: ScrollTriggerLocation;
  scrolltriggerEnd?: ScrollTriggerLocation;
};
const _: InViewOptions = {
  fireOnce: !0,
  scrolltriggerStart: "top bottom",
  scrolltriggerEnd: "bottom top"
};

gsap.registerPlugin(ScrollTrigger);

export function useInView(l: InViewOptions = {}) {
  const c = {
    ..._,
    ...l
  };
  const [d, setElementToObserve] = useState<HTMLElement | null>(null);
  const [v, y] = useState(!1);
  const C = useRef(!1);
  const b: RefObject<ScrollTrigger | null> = useRef(null);
  const x = useWindowResize();
  (useEffect(() => {
    !d ||
      (C.current && c.fireOnce) ||
      (b.current && b.current.kill(),
      (b.current = new ScrollTrigger({
        trigger: d,
        start: c.scrolltriggerStart,
        end: c.scrolltriggerEnd,
        onEnter: () => {
          (y(!0), c.fireOnce && b.current && b.current.kill());
        },
        onEnterBack: () => {
          (y(!0), c.fireOnce && b.current && b.current.kill());
        },
        onLeave: () => {
          c.fireOnce || y(!1);
        },
        onLeaveBack: () => {
          c.fireOnce || y(!1);
        }
      })));
  }, [d, c.fireOnce, c.scrolltriggerStart, c.scrolltriggerEnd, x]),
    useEffect(
      () => () => {
        b.current && b.current.kill();
      },
      []
    ));
  return {
    setElementToObserve,
    isInView: v,
    setIsInView: y
  };
}
