"use client";
import { gsap } from "gsap/all";
import "@/styles/__reviewCard.scss";
import {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import ScrollTrigger from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useWindowResize } from "@/utilities/use_window_resize";
import { useCursor, useRPStore } from "@/providers/RP_Pro";
import { useInView } from "@/hooks/useInView";
import { useTheme } from "@/providers/Theme";
import { useIsMobile as useIsNarrow } from "@/providers/MiddleMan";
import { FrontImage } from "@/components/UX/Media/FrontImage";
import { useShallow } from "zustand/shallow";
import imager from "./ff.jpeg";
gsap.registerPlugin(ScrollTrigger);
const iUnit = 420;
const yEdge = iUnit * 0.153;
const instax = {
  square: {
    rects: {
      inner: {
        height: 1,
        width: 1
      },
      outer: {
        height: 1 * 1.377,
        width: 1 * 1.135
      },
      content: {
        width: 1,
        height: 0.377 * 1 - 2 * 0.153
      }
    },
    edges: {
      y: 0.153,
      x: 0.135 / 2
    }
  },
  wide: {
    rects: {
      inner: {
        height: 1,
        width: 1 * 1.625
      },
      outer: {
        height: 1 * 1.416,
        width: 1 * 1.771
      },
      content: {
        width: 1 * 1.625,
        height: 0.416 * 1 - 2 * 0.153
      }
    },
    edges: {
      y: 0.153,
      x: (1.771 - 1.625) / 2
    }
  }
};
const polaroid = {
  wide: {
    framwWidth: 1,
    frameHeight: 0.8,
    pictureHeight: 0.4415,
    pictureWidth: 1.625 * 0.4415,
    borderY: 0.082 * 0.4415,
    borderX: 0.171 * 0.4415
  },
  narrow: {
    frameWidth: 1,
    frameHeight: 1.619,
    pictureHeight: 1.1418,
    pictureWidth: 0.857,
    borderY: 0.15,
    borderX: 0.0714
  }
};
export const RP_POLAROID = () => {
  const config = {
    author: "<NAME>",
    review: "Hi",
    image: "/media/ff.jpeg"
  };
  const { isInView, setElementToObserve } = useInView({
    fireOnce: !1,
    scrolltriggerStart: "top-=1000px bottom",
    scrolltriggerEnd: "bottom+=200px top"
  });
  const isNarrow = useIsNarrow();
  const [polar, setPolar] = useState(
    isNarrow ? polaroid.narrow : polaroid.wide
  );
  const section = useRef<HTMLElement>(null!),
    img = useRef<HTMLImageElement>(null!),
    footer = useRef<HTMLDivElement>(null!),
    patron = useRef<HTMLSpanElement>(null!);
  const container = useRef<HTMLDivElement>(null!),
    frameContent = useRef<HTMLDivElement>(null!),
    imageContainer = useRef<HTMLDivElement>(null!),
    frameContainer = useRef<HTMLDivElement>(null!),
    frameContentInner = useRef<HTMLDivElement>(null!),
    framePositioning = useRef<HTMLDivElement>(null!),
    timeline = useRef<GSAPTimeline>(null!),
    logo = useRef<SVGSVGElement>(null!);
  const [osH, setOsH] = useState(0);
  const theme = useTheme((r) => r.theme);
  const white = "oklch(98.52% 0.006 23.79/1)";
  const black = "oklch(9.69% 0.0175 23.79/1)";
  const [frameWidth, setFrameWidth] = useState(720);
  const [sectionBG, setSectionBG] = useState(theme === "dark" ? black : white);
  const [sectionFG, setSectionFG] = useState(theme === "dark" ? white : black);
  const wW = useRPStore(useShallow((r) => r.viewportWidth));
  const wH = useRPStore(useShallow((r) => r.viewportHeight));
  useEffect(() => {
    setSectionBG(theme === "dark" ? black : white);
    setSectionFG(theme === "dark" ? white : black);
  }, [theme]);

  const windowResize = useWindowResize({ detectHeightChange: true });
  const [height, setHeight] = useState(0),
    [y, setY] = useState(0);
  useEffect(() => {
    setOsH(container.current.offsetHeight);
    setFrameWidth(framePositioning.current.offsetWidth);
  }, []);

  const calculatePositioning = useCallback(() => {
    const wwi = window.innerWidth;
    const y = wwi >= 767 ? -5 : -100;
    const height = wwi >= 967 ? 30 : wwi >= 767 ? -70 : 160;

    return { y, height };
  }, []);
  const setCursorTheme = useCursor((r) => r.setCursorTheme);
  const resetCursor = useCursor((r) => r.resetCursorTheme);
  useEffect(() => {
    setOsH(container.current.offsetHeight);
    setFrameWidth(framePositioning.current.offsetWidth);
    const { y, height } = calculatePositioning();
    setY(y);
    setHeight(height);
  }, [calculatePositioning, windowResize]);
  useEffect(() => {
    setPolar(isNarrow ? polaroid.narrow : polaroid.wide);
  }, [isNarrow]);
  const offCursor = useCallback(() => {
    resetCursor();
  }, [resetCursor]);
  const [contrast, setContrast] = useState<"dark" | "light">(
    theme === "dark" ? "light" : "dark"
  );
  useEffect(() => {
    setContrast(theme === "dark" ? "light" : "dark");
  }, [theme]);
  const onCursor = useCallback(
    (thema: "dark" | "light") => {
      setCursorTheme(thema);
    },
    [setCursorTheme]
  );

  useGSAP(
    () => {
      if (
        !framePositioning.current ||
        !frameContainer.current ||
        !frameContent.current ||
        !imageContainer.current ||
        !framePositioning.current
      ) {
        return;
      }
      const picWidth = framePositioning.current.offsetWidth;
      const { y: yval, height: hval } = calculatePositioning();
      const picHeight = framePositioning.current.offsetHeight + hval;
      const picOffsetTop = framePositioning.current.offsetTop + yval;

      const newX = framePositioning.current.offsetLeft;
      const borderWidth =
        parseInt(getComputedStyle(frameContainer.current).borderWidth, 10) || 0;
      gsap.set(frameContentInner.current, {
        width: framePositioning.current.offsetWidth - borderWidth * 2
      });
      if (timeline.current) {
        timeline.current.kill();
      }
      gsap.killTweensOf([
        frameContainer.current,
        frameContent.current,
        imageContainer.current
      ]);
      timeline.current = gsap
        .timeline({
          scrollTrigger: {
            trigger: section.current,
            start: "top+=30% bottom",
            end: `bottom 98%`,
            scrub: true,
            markers: false,
            onEnter: () => {
              gsap.set(section.current, {
                autoAlpha: 1
              });
            }
          }
        })
        .fromTo(
          [patron.current, logo.current],
          {
            backgroundColor: sectionBG,
            color: sectionFG
          },
          { backgroundColor: sectionFG, color: sectionBG },
          0
        )

        .fromTo(
          imageContainer.current,
          {
            scale: 1.1,
            y: "-20%",
            width: imageContainer.current.offsetWidth,
            x: "-50%",
            left: "50%"
          },
          {
            scale: 1,
            width: picWidth - 32,
            height: picWidth * (3 / 4) - 24,
            y: "20%",
            x: "-50%",
            left: "50%",
            ease: "power2.out"
          },
          0
        )
        .fromTo(
          frameContainer.current,
          {
            width: window.innerWidth + 48,
            height: window.innerHeight + 48,
            y: -24,
            x: -24,
            borderWidth: 40,
            borderColor: sectionBG
          },
          {
            width: picWidth,
            height: picHeight,
            y: picOffsetTop,
            x: newX,
            borderWidth: 16,
            ease: "power2.inOut",
            borderColor: sectionFG
          },
          "<+=6%"
        )
        .fromTo(
          frameContent.current,
          {
            y: "405%",
            scale: 1.01,
            backgroundColor: sectionBG,
            color: sectionFG
          },
          {
            y: 0,
            scale: 1.01,
            ease: "power2.out",
            height: picHeight - picWidth * (3 / 4) + 8,
            backgroundColor: sectionFG,
            color: sectionBG
          },
          "<"
        );
    },
    {
      scope: container,
      dependencies: [y, height, isNarrow]
    }
  );

  return (
    <section
      ref={(el) => {
        el && (setElementToObserve(el), (section.current = el));
      }}
      className="my-[90px]"
    >
      <div ref={container}>
        <div className="relative grid h-screen min-h-[88rem] w-full grid-cols-[repeat(12,1fr)] gap-0 overflow-hidden px-[2rem] py-0">
          <div
            ref={framePositioning}
            className="review__card-bg_frame-positioning"
            onMouseEnter={() => onCursor(contrast)}
            onMouseLeave={offCursor}
          />
          <div
            ref={imageContainer}
            className="review__card-bg_image-container transform-origin-center"
          >
            <FrontImage
              ref={img}
              src={imager}
              pictureClassName={"absolute inset-0 object-cover"}
              className="review__card-bg_image"
              fill={true}
            />
          </div>
          <div ref={frameContainer} className="review__card-bg_frame-container">
            <div
              ref={frameContent}
              className="review__card-bg_frame-content w-full"
            >
              <div
                ref={frameContentInner}
                className="review__card-bg_frame-content-inner"
              >
                <blockquote className="review__card-bg_quote">
                  {config.review}
                </blockquote>
                <div ref={footer} className="review__card-bg_footer">
                  <address data-themed="color">
                    <span ref={patron} className="review__card-bg_author">
                      {config.author}
                    </span>
                    <span className="review__card-bg_authorDash">
                      &nbsp;-&nbsp;
                    </span>
                    <span className="review__card-bg_source"></span>
                  </address>
                  <RP_Logo ref={logo} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
const RP_Logo = (props: ComponentPropsWithRef<"svg">) => (
  <svg
    className="review__card-bg_logo"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 45 45"
    {...props}
    ref={props.ref}
  >
    <g id="ha_ww">
      <path
        d="m10.17,42.82l-.05-40.63c0-.27.29-.5.64-.5h3.14c.35,0,.64.22.64.5l.03,25.87c0,.27.29.5.64.5h13.63c.35,0,.64-.23.64-.52v-10.96c-.01-.27.27-.5.63-.5h3.14c.35,0,.64.22.64.5l.03,25.74c0,.27-.29.5-.64.5h-3.14c-.35,0-.64-.22-.64-.5v-12.39c-.01-.27-.3-.5-.65-.5h-13.63c-.35,0-.64.23-.64.52v12.39c.01.27-.27.5-.63.5h-3.14c-.35,0-.64-.22-.64-.5h0Z"
        data-themed={"fill"}
        fill="currentColor"
        strokeWidth={0}
      />
      <circle
        cx="31.97"
        cy={7}
        data-filled={"fill"}
        r="2.91"
        fill="currentColor"
        strokeWidth={0}
      />
    </g>
  </svg>
);
