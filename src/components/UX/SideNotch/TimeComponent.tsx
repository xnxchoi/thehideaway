import { useIsMobile } from "@/providers/MiddleMan";
import { useRPStore } from "@/providers/RP_Pro";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { delay } from "@/utilities/rp_utils";
import { useWindowResize } from "@/utilities/use_window_resize";
import { ComponentProps, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { gsap } from "gsap";
import { cn } from "@/lib/utils";
import { useGSAP } from "@gsap/react";
import { TextLoop } from "../TextLoop/TextLoop";
import { EASING } from "@/constants/animations";

export const TimeComponent = (props: ComponentProps<"div">) => {
  const { className: c } = props;
  const clockTimezones = useMemo(
    () => [
      { timezone: "Asia/Seoul", title: "SEL" },
      { timezone: "Europe/London", title: "LHR" },
      { timezone: "Europe/Paris", title: "CDG" },
      { timezone: "America/Los_Angeles", title: "LAX" },
      { timezone: "America/New_York", title: "JFK" }
    ],
    []
  );

  const [locations, setLocation] = useState<string[]>([]);
  const [times, setTime] = useState<string[]>([]);
  const y = useRef<ReturnType<typeof setInterval> | null>(null);
  const { isMobile } = useIsMobile();
  const b = useRef<HTMLDivElement>(null!);
  const navIsOpen = useRPStore(useShallow((l) => l.navIsOpen));
  const isHome = useVoyageur(useShallow((r) => r.isHome));
  const is404 = useVoyageur(useShallow((r) => r.is404));
  const P = useRef<HTMLSpanElement[]>([]);
  const A = useRef<HTMLSpanElement[]>([]);
  useEffect(() => {
    if (isMobile) {
      y.current && clearInterval(y.current);
      return;
    }
    const fire = () => {
      const a: string[] = [],
        b: string[] = [];
      clockTimezones.forEach((l) => {
        const c = new Date().toLocaleDateString("en-GB", {
          timeZone: l.timezone,
          hour: "2-digit",
          minute: "2-digit"
        });
        const d = c.split(" ")[1];
        const h = parseInt(d.split(":")[0]);
        const v = parseInt(d.split(":")[1] || "0")!;
        const p = `${v < 10 ? "0" + v : v}`;
        const m = h > 11 ? "PM" : "AM";
        const g = `${h > 12 ? h - 12 : 0 === h ? 12 : h}`;
        a.push(l.title);
        b.push(g + ":" + p + " " + m);
      });
      setLocation(a);
      setTime(b);
    };
    fire();
    y.current = setInterval(() => {
      fire();
    }, 5e3);
  }, [clockTimezones, isMobile]);
  //   useEffect(() => {
  //     if (!b.current) return;
  //     const l = (isHome || is404) && !navIsOpen;
  //     (gsap.killTweensOf(b.current),
  //       gsap.to(b.current, {
  //         x: l ? 30 : 0
  //       }));
  //   }, [isHome, is404, navIsOpen]);
  return !isMobile ? (
    <div ref={b} className={"block text-xs leading-[120%]"}>
      <span
        className={
          "relative grid overflow-hidden transition-colors duration-200 ease-out-power2 [grid-template-areas:'a']"
        }
        data-themed="color,border-color"
        style={{
          writingMode: "sideways-lr"
        }}
      >
        <span className={"flex [grid-area:a]"}>
          <TextLoop
            className={"overflow-hidden font-sans text-xs font-light"}
            variants={{
              initial: { x: "105%", opacity: 0 },
              animate: {
                x: 0,
                opacity: 1,
                transition: {
                  type: "tween",
                  ease: EASING.power3.out,
                  duration: 0.8
                }
              },
              exit: {
                x: "-105%",
                opacity: 0,
                transition: {
                  type: "tween",
                  ease: EASING.power3.out,
                  duration: 0.8
                }
              }
            }}
            interval={7}
            transition={{
              type: "tween",
              ease: EASING.power3.out,
              duration: 0.8
            }}
          >
            {locations.map((l, c) => (
              <span
                ref={(l) => {
                  l && (A.current[c] = l);
                }}
                key={c + l}
                className={cn("block")}
              >
                {l}
              </span>
            ))}
          </TextLoop>
          <TextLoop
            className={"overflow-hidden font-sans text-xs font-light"}
            variants={{
              initial: { x: "105%", opacity: 0 },
              animate: {
                x: 0,
                opacity: 1,
                transition: {
                  type: "tween",
                  ease: EASING.power3.out,
                  duration: 0.8,
                  delay: 0.1
                }
              },
              exit: {
                x: "-105%",
                opacity: 0,
                transition: {
                  type: "tween",
                  ease: EASING.power3.out,
                  duration: 0.8,
                  delay: 0.1
                }
              }
            }}
            interval={7}
            transition={{
              type: "tween",
              ease: EASING.power3.out,
              delay: 0.1,
              duration: 0.8
            }}
          >
            {times.map((l, c) => (
              <span
                ref={(l) => {
                  l && (P.current[c] = l);
                }}
                key={c + l}
                className={cn("block")}
              >
                &nbsp; {l}
              </span>
            ))}
          </TextLoop>
        </span>
      </span>
    </div>
  ) : null;
};
