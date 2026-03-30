import { useDomCursor } from "@/components/core/cursorWrapper";
import { useHighlighter } from "@/components/UX/Highlightr/providers/HighlighterProvider";
import { HighlightPalette } from "@/components/UX/Highlightr/stores";
import { SPRING_EASE } from "@/constants/animations";
import { useWindowResize } from "@/utilities/use_window_resize";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import {
  HTMLMotionProps,
  MotionValue,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform
} from "motion/react";
import * as m from "motion/react-m";
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState
} from "react";
import { useShallow } from "zustand/shallow";

const MiniMapItem = ({
  onMouseEnter: onEnter,
  onMouseLeave: onLeave,
  style,
  scaleValue,
  targets,
  contentContainer,
  ...props
}: HTMLMotionProps<"div"> & {
  targets: HTMLElement[];
  scaleValue: MotionValue<number>;
  contentContainer: RefObject<HTMLDivElement>;
}) => {
  const hTop = useMotionValue(window.innerHeight);
  const lenis = useLenis();
  const scrollToY = useMotionValue(0);
  const translateYV = useTransform(() => hTop.get() * scaleValue.get());
  const lastResize = useWindowResize({
    debounce: 100,
    detectHeightChange: true
  });
  const translateY = useSpring(translateYV, {
    ...SPRING_EASE.power2.inOut,
    duration: 0.2
  });
  const setUp = useEffectEvent(() => {
    const placement = targets
      .filter((r) => r.isConnected)
      .reduce((acc, t) => Math.min(t.offsetTop, acc), window.innerHeight);
    const cont = contentContainer.current;
    if (!cont) return;
    const contOff = cont.offsetTop;
    const contDimension = cont.offsetHeight;
    const y = contOff + placement - 250;
    const top = (placement / contDimension) * window.innerHeight * 0.85;
    scrollToY.set(y);
    hTop.set(top);
  });
  const onClick = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();
      lenis?.scrollTo(scrollToY.get());
    },
    [lenis, scrollToY]
  );
  const { onMouseEnter, onMouseLeave } = useDomCursor({
    onEnter,
    onLeave
  });
  useEffect(() => {
    setUp();
  }, []);
  useEffect(() => {
    setUp();
  }, [lastResize]);
  return (
    <m.div
      className="pointer-events-auto absolute top-0 left-0 z-10 h-[3px] w-full border-0 border-b-[1px] border-foreground/20 transition-all duration-200 ease-out-power2 hover:-top-[3px] hover:h-[10px]"
      {...props}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        translateY
      }}
    ></m.div>
  );
};
export const MiniMap = ({
  highlightMap,
  scaleRatio,
  contentContainer,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  contentContainer: RefObject<HTMLDivElement>;
  highlightMap: Array<{
    y: number;
    top: number;
  }>;
  scaleRatio: number;
}) => {
  const highlights = useHighlighter(useShallow((r) => r.highlights));

  const currentColor = useHighlighter(useShallow((r) => r.currentColor));
  const mapBackdropRef = useRef<HTMLDivElement>(null!);
  const mapTrackRef = useRef<HTMLDivElement>(null!);
  const highMaps = useRef<HTMLDivElement[]>([]);
  const lastResize = useWindowResize({
    detectVisibilityChange: false,
    detectHeightChange: true
  });
  const [scale_, setScale_] = useState(1);
  const scaleValue = useMotionValue(scaleRatio);
  useEffect(() => {
    setScale_(scaleRatio);
    scaleValue.set(scaleRatio);
  }, [lastResize, scaleRatio, scaleValue]);
  const ccc = useMotionValue(HighlightPalette[currentColor] as string);
  useEffect(() => {
    ccc.set(HighlightPalette[currentColor]);
  }, [ccc, currentColor]);
  const ccec = useSpring(ccc, {
    ...SPRING_EASE.power2.inOut,
    duration: 0.2
  });
  const colllor = useMotionTemplate`color-mix(in oklch,${ccec} 85%, var(--color-faded-white))`;

  useGSAP(() => {
    highMaps.current.forEach((e, t) => {
      const y = highlightMap[t]?.top;
      if (!y) return;
      gsap.to(e, {
        translateY: y * scale_,
        duration: 0.1,
        ease: "power2.inOut"
      });
    });
  }, [scale_]);
  return (
    <div
      className="pointer-events-none fixed top-[55px] right-[40px] bottom-[50px] z-[250] w-[24px] origin-[0_0] scale-x-50 overflow-hidden transition-transform duration-200"
      ref={mapTrackRef}
      {...props}
    >
      <div
        ref={mapBackdropRef}
        className="absolute h-full w-full origin-[100%_0]"
      ></div>
      {highlights
        .values()
        .map(({ els }) => els as HTMLElement[])
        .map((e, t) => (
          <MiniMapItem
            targets={e}
            scaleValue={scaleValue}
            contentContainer={contentContainer}
            key={"highMap" + t}
            color={currentColor}
            style={{ backgroundColor: colllor }}
          />
        ))}
    </div>
  );
};
