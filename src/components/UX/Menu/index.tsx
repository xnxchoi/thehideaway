"use client";

import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { DateTime } from "luxon";
import {
  RefObject,
  SVGAttributes,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import {
  useCursorStore,
  useDeviceInfo,
  useMenu,
  useRPStore
} from "@/providers/RP_Pro";
import { getPageTypeFromUrl } from "@/utilities/Helpers";
import { useWindowResize } from "@/utilities/use_window_resize";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/providers/MiddleMan";
import { SvgIco } from "@/components/UX/svgIco";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";
import { Link } from "@/components/UX/Link";
import { getServerSideURL } from "@/utilities/getURL";
import { useGSAP } from "@gsap/react";
import { CornerSide, FrameSide } from "@/stores/Frame_Ctrl";
import * as m from "motion/react-m";
import { useTheme } from "@/providers/Theme";

const B = "navWindow";
export const getNavId = () => B;

export const RP_Menu = () => {
  const H = 590;
  const setBase = useMenu((l) => l.setBase);
  const { top, bottom, right, left } = useMenu((l) => l.frames);
  const { isMobile } = useIsMobile();
  const isAndroid = useDeviceInfo((r) => r.os.isAndroid);
  const frames: FrameSide[] = ["top", "right", "bottom", "left"];
  const keyedFrames = useRef<{ [x: string]: string }>({});
  const keyedCorners = useRef<{ [x: string]: string }>({});
  const keyedSvg = useRef<{ [x: string]: string }>({});
  const corners: CornerSide[] = [
    "topleft",
    "topright",
    "bottomright",
    "bottomleft"
  ];

  const size = isMobile ? "2rem" : "2.2rem";
  const pageType = useVoyageur((l) => l.pageType);
  const pageSlug = useVoyageur((l) => l.slug);
  const focusedRef = useRef<-1 | string>(-1),
    activeRef = useRef<string | -1>(-1),
    [activeIndex, setActiveIndex] = useState<string | -1>(-1);
  const toggleMenu = useRef<
    (isNavOpen: boolean, needsResizing: boolean) => void
  >(null!);
  const setNavOpeningElement = useRPStore((l) => l.setNavOpeningElement);
  /**
   * Ref Objects for Navigation Items
   *
   */
  const navigationList = useRef<HTMLUListElement>(null!);
  const navItems = useRef<HTMLLIElement[]>([]);
  const navLines = useRef<HTMLSpanElement[]>([]);
  const navButtons = useRef<HTMLAnchorElement[]>([]);
  const navWindow = useRef<HTMLDivElement>(null!);
  /**
   *  Menu Frame ref Objects
   */
  const menuFrames: RefObject<Array<HTMLDivElement>> = useRef([]);
  const menuCorners: RefObject<Array<HTMLDivElement>> = useRef([]);
  const menuSVgs: RefObject<Array<HTMLDivElement>> = useRef([]);

  /**
   * Cursor Functions
   */
  const setCursorTheme = useCursorStore((l) => l.setCursorTheme);
  const resetCursorTheme = useCursorStore((l) => l.resetCursorTheme);
  /**
   *  Transition / UI Functions
   */
  const theme = useRPStore((l) => l.theme);
  const setCanInteract = useRPStore((store) => store.setCanInteract);
  const setTransitionOutType = useRPStore(
    (store) => store.setTransitionOutType
  );
  const setNavigationPageIsTransitioning = useRPStore(
    (store) => store.setNavigationPageIsTransitioning
  );
  const navIsOpen = useRPStore((l) => l.navIsOpen);
  const setNavIsTransitioning = useRPStore((l) => l.setNavIsTransitioning);
  const setNavIsOpen = useRPStore((l) => l.setNavIsOpen);
  const navigationSettings = useRPStore((l) => l.globalSettings.navigation);

  const setNavIsOpenDebounced = useRPStore((l) => l.setNavIsOpenDebounced);
  const menuPageItemKeys = useRPStore((l) => l.navigationPageItemKeys);
  const lastAdjustRealTime = useRef(DateTime.now().year);
  const currentPageKey = useVoyageur((l) => l.pageKey);
  const setNavItemHovered = useRPStore((l) => l.setNavigationPageItemHovered);
  const setNavItemSelected = useRPStore((l) => l.setNavigationPageItemSelected);
  const focusedTO = useRef<ReturnType<typeof setTimeout>>(null!);
  const menuWrap = useRef<HTMLDivElement>(null!);
  useEffect(() => {
    setNavOpeningElement(navWindow.current);
  }, []);
  const handlePagePreviewMouseEnter = (pagekey: string | -1) => {
    currentPageKey !== pagekey && setNavItemHovered(pagekey);
  };
  const handlePagePreviewMouseLeave = () => {
    setNavItemHovered(-1);
  };
  const serverurl = getServerSideURL();

  const hoveredNavItem = useRPStore((l) => l.navigationPageItemHovered);
  const activeNavItem = useRPStore((l) => l.navigationPageItemSelected);
  const activeTO = useRef<ReturnType<typeof setTimeout>>(null!);
  useEffect(() => {
    if (hoveredNavItem === -1) {
      {
        activeTO.current && clearTimeout(activeTO.current);
        activeTO.current = setTimeout(() => {
          setActiveIndex(currentPageKey);
        }, 450);
      }
    }
  }, [hoveredNavItem]);
  const menuToPageCallback = useCallback(
    (pagekey: string) => {
      (setTransitionOutType("FROM_MENU"),
        setNavItemSelected(pagekey),
        setNavigationPageIsTransitioning(true),
        setCanInteract(false));
      setTimeout(() => {
        setCanInteract(true);
        setNavIsOpen(!1);
      }, 6000);
    },
    [
      setCanInteract,
      setNavIsOpen,
      setNavigationPageIsTransitioning,
      setActiveIndex,
      setTransitionOutType
    ]
  );
  const handlePagePreviewClick = (pageKey: string) => {
      isMobile
        ? (handlePagePreviewMouseEnter(pageKey),
          setTimeout(() => {
            menuToPageCallback(pageKey);
          }, 300))
        : menuToPageCallback(pageKey);
    },
    er = useRef(null),
    resizeTime = useWindowResize({ debounce: 100 }),
    lastResize = useRef(0);
  const focusResetTO = useRef<ReturnType<typeof setTimeout>>(null!);
  const isHome = useVoyageur((l) => l.isHome);
  useEffect(() => {
    (focusResetTO.current && clearTimeout(focusResetTO.current),
      (focusResetTO.current = setTimeout(() => {
        setNavIsOpenDebounced(navIsOpen);
      }, 400)));
  }, [setNavIsOpenDebounced, navIsOpen]);
  const { contextSafe: anotherOne } = useGSAP({
    dependencies: [hoveredNavItem, activeIndex],
    scope: menuWrap
  });
  const resetFrames = anotherOne(() => {
    const l = focusedRef.current !== activeIndex;
    const nothingIsActive = activeIndex === -1 && hoveredNavItem === -1;
    const resetElement = (
      l: gsap.TweenTarget,
      c: gsap.TweenTarget,
      d = 0.3
    ) => {
      const dur = 0.3;
      gsap.killTweensOf([l, c]);
      gsap.to(l, {
        x: "102%",
        duration: dur
      });
      gsap.to(c, {
        autoAlpha: d,
        duration: dur
      });
    };
    navLines.current.forEach((navLine, h) => {
      if (!navLine) {
        return;
      }
      const currentButton = navButtons.current[h];
      if (currentButton) {
        if (l) {
          resetElement(navLine, currentButton, nothingIsActive ? 1 : 0.3);
        }
        if (
          menuPageItemKeys[h] === hoveredNavItem ||
          (hoveredNavItem === -1 && menuPageItemKeys[h] === activeIndex)
        ) {
          gsap.killTweensOf([navLine, currentButton]);
          gsap.fromTo(
            navLine,
            {
              x: "-102%"
            },
            {
              x: 0,
              duration: 0.6,
              ease: "Power3.easeOut"
            }
          );
          gsap.to(currentButton, {
            autoAlpha: 1,
            duration: 0.6,
            ease: "Power3.easeOut"
          });
        } else if (
          menuPageItemKeys[h] === activeRef.current ||
          (hoveredNavItem !== -1 && menuPageItemKeys[h] === activeIndex) ||
          activeIndex === -1
        ) {
          resetElement(navLine, currentButton);
        }
        if (nothingIsActive) {
          gsap.killTweensOf([navLine, currentButton]);
          resetElement(navLine, currentButton, 1);
        }
      }
    });
    activeRef.current = hoveredNavItem;
    focusedRef.current = activeIndex;
  });

  useEffect(() => {
    setActiveIndex(-1);
    (isHome && window.innerHeight > H && !isMobile) ||
      navItems.current.forEach((el, ind) => {
        if (el && el.dataset.isActive == "true") {
          setTimeout(() => {
            setActiveIndex(menuPageItemKeys[ind] || -1);
          }, 400);
        }
      });
  }, [isHome, isMobile]);
  const links = useRPStore((r) => r.navigationPageItemData);
  const previewMedia = useRPStore((r) => r.navigationPreviewMediaByKey);

  const toggleMenuCallback = useCallback(
    (
      isNavOpen: boolean,
      needsResizing: boolean,
      top: number,
      right: number,
      bottom: number,
      left: number
    ) => {
      if (!er.current || !navWindow.current) {
        return;
      }
      setNavIsTransitioning(!0);
      const navWClient = (
        navWindow.current as HTMLElement
      ).getBoundingClientRect();
      const windowHeight = (navWindow.current as HTMLElement).offsetHeight;
      const windowXOff = navWClient.left;
      const windowYOff = navWClient.top;
      gsap.killTweensOf([...menuSVgs.current, ...navItems.current, er.current]);

      menuFrames.current.forEach((frame, ind) => {
        if (!frame) {
          return;
        }
        gsap.killTweensOf(frame);
        let xOff: string | number = 0;
        let yOff: string | number = 0;
        const frameRect = frame.getBoundingClientRect();
        if (!isNavOpen) {
          switch (ind) {
            case 0:
              yOff = -frameRect.height + top;
              break;
            case 1:
              xOff = isMobile ? right : frame.offsetWidth - right;
              break;
            case 2:
              // yOff = isMobile && os.name === 'android' ? frame.offsetHeight : '100%'
              yOff = isMobile
                ? isAndroid
                  ? frameRect.height
                  : frameRect.height - 20
                : frameRect.height - bottom;
              break;
            case 3:
              xOff = isMobile ? -left : -frameRect.width + left;
          }
        }
        gsap.to(frame, {
          x: xOff,
          y: yOff,
          autoAlpha: 1,
          duration: isNavOpen ? 1.2 : 1.2,
          ease: isNavOpen ? "Power4.easeInOut" : "Power3.easeInOut"
        });
      });
      menuCorners.current.forEach((corner, indx) => {
        let xoffse = 0;
        let yoffse = 0;
        if (!corner) {
          return;
        }
        gsap.killTweensOf(corner);
        if (!isNavOpen && isMobile && isAndroid) {
          const l = menuFrames.current[2];
          const c = l?.offsetHeight || 0;
          switch (indx) {
            case 2:
            case 3:
              yoffse = c - c / 1.5;
          }
        }
        switch (indx) {
          case 0:
            if (isNavOpen) {
              yoffse = windowYOff;
              xoffse = windowXOff;
            } else {
              yoffse = top;
              xoffse = left;
            }
            break;
          case 1:
            if (isNavOpen) {
              yoffse = windowYOff;
              xoffse = -windowXOff;
            } else {
              yoffse = top;
              xoffse = -right;
            }
            break;
          case 2:
            if (isNavOpen) {
              xoffse = -windowXOff;
              yoffse = isMobile
                ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
                : -windowYOff;
            } else {
              yoffse = -bottom;
              xoffse = -right;
            }
            break;
          case 3:
            if (isNavOpen) {
              xoffse = windowXOff;
              yoffse = isMobile
                ? -((window.innerHeight - (windowHeight + windowYOff)) * 1) + 1
                : -windowYOff;
            } else {
              yoffse = -bottom;
              xoffse = left;
            }
        }

        gsap.to(corner, {
          x: xoffse,
          y: yoffse,
          duration: isNavOpen ? 1.2 : 1.2,
          ease: isNavOpen ? "Power4.easeInOut" : "Power3.easeInOut"
        });
      });
      menuSVgs.current.forEach((svg) => {
        if (svg) {
          const m = {
            scale: 1,
            duration: isNavOpen ? 1.2 : 1.2,
            ease: isNavOpen ? "Power4.easeInOut" : "Power3.easeInOut"
          };
          needsResizing ? gsap.set(svg, m) : gsap.to(svg, m);
        }
      });
      const startLoc = isMobile ? 0 : -150;
      const moveTargets = [navigationList.current];

      gsap.killTweensOf(moveTargets);
      gsap[needsResizing ? "set" : "to"](moveTargets, {
        x: isNavOpen ? 0 : startLoc,
        autoAlpha: isNavOpen ? 1 : 0,
        delay: isNavOpen ? 0.75 : 0,
        duration: isNavOpen ? 1.2 : 1.2 * 0.75,
        ease: "Power3.easeOut"
      });
      gsap[needsResizing ? "set" : "to"](er.current, {
        autoAlpha: isNavOpen ? 1 : 0,
        delay: isNavOpen ? 0.5 : 0,
        duration: isNavOpen ? 1.2 : 1.2,
        onComplete: () => {
          setNavIsTransitioning(false);
        }
      });
    },
    [isMobile, setNavIsTransitioning]
  );

  useEffect(() => {
    (setActiveIndex(-1),
      (isHome && window.innerHeight > H && !isMobile) ||
        navItems.current.forEach((l, c) => {
          l &&
            "true" === l.dataset.isActive &&
            setTimeout(() => {
              setActiveIndex(menuPageItemKeys[c] || -1);
            }, 400);
        }));
  }, [setActiveIndex, menuPageItemKeys, currentPageKey, isHome, isMobile]);

  useEffect(() => {
    resetFrames();
  }, [resetFrames]);
  const lastNavOpen = useRef(navIsOpen);

  const lenis = useLenis();
  useEffect(() => {
    lenis && lenis[navIsOpen ? "stop" : "start"]();
    document.body.classList[navIsOpen ? "add" : "remove"]("menu__open");
    const needsResizing =
      lastResize.current === 0 || lastResize.current !== resizeTime;
    toggleMenuCallback(
      navIsOpen,
      lastResize.current !== resizeTime,
      top,
      right,
      bottom,
      left
    );
    if (lastNavOpen.current !== navIsOpen || needsResizing) {
      lastResize.current = resizeTime;
    }
    lastNavOpen.current = navIsOpen;
    navIsOpen || setNavItemHovered(-1);
  }, [
    navIsOpen,
    resizeTime,
    setNavItemHovered,
    toggleMenuCallback,
    lenis,
    top,
    right,
    bottom,
    left
  ]);

  const onMouseEnter = useCallback(() => {
    setCursorTheme("dark");
  }, []);
  const onMouseLeave = useCallback(() => {
    resetCursorTheme();
  }, []);
  return (
    <>
      <div
        ref={menuWrap}
        className={cn("menu__body", { menu__open: navIsOpen })}
      >
        <div
          className="menu__window-pos"
          ref={navWindow}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={() => {
            setNavIsOpen(false);
            resetCursorTheme();
          }}
          id={B}
        />
        <nav className="menu__navigation">
          <ul
            className="menu__nav-items-list scroll__items"
            ref={navigationList}
          >
            {links.map((l, index) => {
              const type = getPageTypeFromUrl(l.link.url);
              const slug = l.link.url.split("/")[1]!;
              const theKey = menuPageItemKeys[index];
              const href = l.link.url;
              return (
                <li
                  className="menu__nav-item"
                  key={index + "nav_item"}
                  ref={(el) => {
                    el && (navItems.current[index] = el);
                  }}
                  data-is-active={currentPageKey === theKey}
                  data-themed="color"
                  style={{}}
                >
                  <Link
                    ref={(el: HTMLAnchorElement) => {
                      el && (navButtons.current[index] = el);
                    }}
                    key={index + "-" + theKey}
                    className={"button__scroll lift__button"}
                    href={href}
                    onMouseEnter={() =>
                      handlePagePreviewMouseEnter(theKey || -1)
                    }
                    onMouseLeave={() =>
                      isMobile || handlePagePreviewMouseLeave()
                    }
                    onClick={async () => {
                      handlePagePreviewClick(theKey || "default");
                    }}
                  >
                    {l.link.label}
                  </Link>
                  <span className="menu__item-line-container">
                    <span
                      className="menu__item-line"
                      data-themed="background-color"
                      style={{
                        translate: "none",
                        rotate: "none",
                        scale: "none",
                        transform: "translate(102%, 0px)"
                      }}
                      ref={(el) => {
                        el && (navLines.current[index] = el);
                      }}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="menu__noti-scroller">
          <div
            className="notifications__list"
            style={{ opacity: 0, visibility: "hidden" }}
          />
        </div>
        <p ref={er} className="menu__year" data-themed="color">
          {`\xa9${lastAdjustRealTime.current}`}
        </p>
        <div>
          {frames.map((frame, ind) => {
            return (
              <div
                className={cn("menu__frame", `frame-${frame}`)}
                id={`frame-${frame}`}
                ref={(el) => {
                  if (el) {
                    menuFrames.current[ind] = el;
                    keyedFrames.current[`${frame}`] = `frame-${frame}`;
                  }
                }}
                data-themed="background-color"
                key={`${frame + ind}`}
              />
            );
          })}
          {corners.map((corner, ind) => {
            return (
              <div
                className={cn(["menu__frame-corner", `corner-${corner}`])}
                ref={(el) => {
                  if (el) {
                    menuCorners.current[ind] = el;
                    keyedCorners.current[`${corner}`] = `corner-${corner}`;
                  }
                }}
                id={`corner-${corner}`}
                key={corner + "frame"}
              >
                <div
                  className="menu__corner-svg"
                  ref={(el) => {
                    if (el) {
                      menuSVgs.current[ind] = el;
                      keyedSvg.current[`${corner}`] = `svg-${corner}`;
                    }
                  }}
                  id={`svg-${corner}`}
                  style={{
                    position: "relative",
                    translate: "none",
                    rotate: "none",
                    scale: "none",
                    transform: "translate(0px, 0px)",
                    width: size,
                    height: size
                  }}
                >
                  <CornerStone side={corner} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const Corner = {
  mobile: {
    topright:
      "M.07.01c50.62,2.79,51.7,3.82,56.01,56.12,0-.45,0-3.7,0-8.44,0-13.09.02-35.5-.01-47.69C40.43,0,14.98,0,0,0h.07Z",
    topleft:
      "M56.07,0C41.09,0,15.65,0,.01,0,0,12.23,0,34.57,0,47.69c0,4.74,0,8,0,8.44C.92,3.75,2.1,2.82,56,.01h.07Z",
    bottomright:
      "M0,56.13c14.99,0,40.42.01,56.06,0,.02-12.23.01-34.56.01-47.69,0-4.74,0-8,0-8.44C53.76,52.46,52.63,53.43.07,56.12h-.07Z",
    bottomleft:
      "M0,0c.02,10.34-.01,29.22,0,40.94,0,8.72,0,15.31,0,15.18,2.85.03,7.55-.02,15.18,0,10.22,0,22.94,0,32.7,0,4.69,0,7.88,0,8.24,0,0,0,.05,0,0,0h-.3c-35.4-1.47-50.86,1.97-54.23-24.43C.39,22.32.28,10.22,0,.06v-.06Z"
  },
  desktop: {
    topright: "M0,0q25.73,1.58,28.07,28.07V0H0Z",
    bottomleft: "M0,0v28.07h28.07Q.65,27.54,0,0Z",
    bottomright: "M0,28.07h28.07V0Q26.73,26.54,0,28.07Z",
    topleft: "M28.07,0H0v28.07Q.65,1.58,28.07,0Z"
  }
};

const CornerStone = (
  props: { side: string } & SVGAttributes<SVGPathElement>
) => {
  const ref = useRef<SVGSVGElement>(null);
  const refMobile = useRef<SVGSVGElement>(null);
  const refDark = useRef<SVGSVGElement>(null);
  const { side, ...rest } = props;
  const { isMobile } = useIsMobile();

  const dimes = {
    mobile: 56.15,
    desktop: 28.07
  };
  const theme = useTheme((state) => state.theme);
  const sides = ["t", "b"].flatMap((side) => {
    return ["r", "l"].flatMap((suf) => {
      return `${side}${suf}`;
    });
  });
  const [de, setDe] = useState<string>("");
  useEffect(() => {
    setDe(Corner[isMobile ? "mobile" : "desktop"][side as CornerSide]);
  }, []);

  useEffect(() => {
    gsap.to(`#cs_${side}`, {
      autoAlpha: 0,
      duration: 0.4,
      onComplete: () =>
        setDe(Corner[isMobile ? "mobile" : "desktop"][side as CornerSide])
    });

    gsap.to(`#cs_${side}`, {
      delay: 0.5,
      duration: 0.4,
      autoAlpha: 1
    });
  }, [isMobile]);
  const size = isMobile ? "2rem" : "2.2rem";
  return (
    <>
      <SvgIco
        ref={ref}
        id={`cs_${side}`}
        viewBox={isMobile ? `0 0 56.15 56.15` : `0 0 28.07 28.07`}
        style={{
          width: size,
          height: size,
          display: "inline-block",
          position: "absolute",
          inset: 0
        }}
        paths={[
          {
            d: de,
            "data-themed": "fill,color",
            clipRule: "evenodd",
            fillRule: "evenodd",
            ...rest
          }
        ]}
      />
      {theme === "dark" && (
        <m.svg
          ref={refDark}
          id={`cs_${side}_dark`}
          viewBox={isMobile ? `0 0 56.15 56.15` : `0 0 28.07 28.07`}
          initial={{
            opacity: 0,
            visibility: "hidden"
          }}
          animate={{
            opacity: 1,
            visibility: "visible",
            transition: {
              duration: 0.4,
              delay: 0.5,
              ease: "easeInOut",
              type: "tween"
            }
          }}
          exit={{
            opacity: 0,
            visibility: "hidden",
            transition: {
              duration: 0.4,

              ease: "easeInOut",
              type: "tween"
            }
          }}
          style={{
            width: size,
            height: size,
            display: "inline-block",
            position: "absolute",
            inset: 0,
            fill: "none"
          }}
        >
          <m.path
            d={de}
            data-themed="stroke,color"
            clipRule="evenodd"
            fillRule="evenodd"
            strokeWidth={1.2}
            stroke="oklch(var(--n-s-bbg)/.04)"
            initial={{
              opacity: 0,
              visibility: "hidden"
            }}
            animate={{
              opacity: 1,
              visibility: "visible",
              transition: {
                duration: 0.4,
                delay: 0.5,
                ease: "easeInOut",
                type: "tween"
              }
            }}
            exit={{
              opacity: 0,
              visibility: "hidden",
              transition: {
                duration: 0.4,

                ease: "easeInOut",
                type: "tween"
              }
            }}
          />
        </m.svg>
      )}
    </>
  );
};
