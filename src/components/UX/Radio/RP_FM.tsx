"use client";

import { useIsMobile } from "@/providers/MiddleMan";
import { useDeviceInfo, useRPStore } from "@/providers/RP_Pro";
import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/shallow";
import { cn } from "../../../lib/utils";
import { Button } from "../Button";
import { BASETRACK } from "./constants";
import LP_Small from "./disk.png";
import LP_Large from "./disk@2x.png";
import Sheen_Small from "./shine.png";
import Sheen_Large from "./shine@2x.png";
import { nanoid } from "nanoid";

gsap.registerPlugin(MorphSVGPlugin);
export const RP_FM = () => {
  return (
    <div className="flex gap-2 py-4 pr-2 pl-8">
      {/* <div className="flex w-[50%] flex-col items-center justify-center">
        <LP />
      </div> */}
      <div className="flex h-[250px] w-[50%] flex-col items-center justify-center">
        <RP_Radio />
      </div>
    </div>
  );
};

const LP = () => {
  const playing = useRadioStore((r) => r.playing);
  const trackStatus = useRadioStore((r) => r.trackStatus);
  const currentIndex = useRadioStore((r) => r.currentIndex);
  const tracks = useRadioStore((r) => r.tracks);
  const [track, setTrack] = useState(tracks[currentIndex] || null);
  const { toggle } = useRadio();
  const isMobile = useDeviceInfo(useShallow((d) => d.isMobile));
  const [lpImage, setLPImage] = useState(LP_Large);
  const [sheenImage, setSheenImage] = useState(Sheen_Large);
  useEffect(() => {}, []);
  useEffect(() => {
    if (isMobile) {
      setLPImage(LP_Small);
      setSheenImage(Sheen_Small);
    } else {
      setLPImage(LP_Large);
      setSheenImage(Sheen_Large);
    }
  }, [isMobile]);
  const whoCallback = useCallback((isPlaying: boolean) => {
    if (isPlaying) {
      return "WHO'S PLAYING?";
    }
    return "CLICK FOR MORE";
  }, []);
  const [artist, setArtist] = useState("Summer");
  const [album, setAlbum] = useState("The Hideaway Sessions Vol.1");
  const [title, setTitle] = useState("Summer Sessions");

  const sidebarOpen = useRPStore(useShallow((r) => r.sidebarOpen));
  const pauseIcon = useMemo(
    () =>
      "M6.04995 2.74998C6.04995 2.44623 5.80371 2.19998 5.49995 2.19998C5.19619 2.19998 4.94995 2.44623 4.94995 2.74998V12.25C4.94995 12.5537 5.19619 12.8 5.49995 12.8C5.80371 12.8 6.04995 12.5537 6.04995 12.25V2.74998ZM10.05 2.74998C10.05 2.44623 9.80371 2.19998 9.49995 2.19998C9.19619 2.19998 8.94995 2.44623 8.94995 2.74998V12.25C8.94995 12.5537 9.19619 12.8 9.49995 12.8C9.80371 12.8 10.05 12.5537 10.05 12.25V2.74998Z",
    []
  );
  const playIcon = useMemo(
    () =>
      "M3.24182 2.32181C3.3919 2.23132 3.5784 2.22601 3.73338 2.30781L12.7334 7.05781C12.8974 7.14436 13 7.31457 13 7.5C13 7.68543 12.8974 7.85564 12.7334 7.94219L3.73338 12.6922C3.5784 12.774 3.3919 12.7687 3.24182 12.6782C3.09175 12.5877 3 12.4252 3 12.25V2.75C3 2.57476 3.09175 2.4123 3.24182 2.32181ZM4 3.57925V11.4207L11.4288 7.5L4 3.57925Z",
    []
  );
  const trackTitle = useRef<HTMLDivElement>(null!);
  const trackArtist = useRef<HTMLDivElement>(null!);
  const trackAlbum = useRef<HTMLDivElement>(null!);
  const lpTL = useRef<GSAPTimeline>(null!);
  const innerRef = useRef<HTMLImageElement>(null!);
  const lpRef = useRef<HTMLDivElement>(null!);
  const pathRef = useRef<SVGPathElement>(null!);
  const lpWrapperRef = useRef<HTMLDivElement>(null!);
  const indicatorTL = useRef<GSAPTimeline>(null!);
  useGSAP(
    () => {
      lpTL.current = gsap
        .timeline({
          defaults: {
            ease: "none",
            repeat: -1,
            yoyo: false,

            overwrite: true
          }
        })
        .to(lpRef.current, {
          rotate: 360,
          duration: 5
        })
        .to(
          innerRef.current,
          {
            rotate: 360,
            duration: 4
          },
          0
        );
      indicatorTL.current = gsap
        .timeline({
          defaults: { duration: 0.3, ease: "power2.in" },
          paused: true
        })
        .fromTo(
          pathRef.current,
          {
            morphSVG: {
              type: "rotational",
              map: "complexity",
              shape: pauseIcon
            }
          },
          {
            morphSVG: {
              type: "rotational",
              map: "complexity",
              shape: playIcon
            }
          }
        );
    },
    { scope: lpWrapperRef }
  );

  useGSAP(
    () => {
      gsap.to(lpTL.current, {
        timeScale: sidebarOpen && trackStatus === "playing" ? 1 : 0,
        duration: 0.8,
        overwrite: true,
        ease: trackStatus === "playing" ? "power2.in" : "power2.out"
      });
    },
    { dependencies: [sidebarOpen, trackStatus], scope: lpWrapperRef }
  );

  useEffect(() => {
    const track = tracks[currentIndex];
    setTrack(track || null);
  }, [currentIndex, tracks]);
  useEffect(() => {
    if (!track) {
      setTitle("");
      setArtist("");
      setAlbum("");
      return;
    }
    const { title, artist, album } = track;
    setTitle(title);
    setArtist(artist);
    setAlbum(album);
  }, [track]);
  useEffect(() => {
    if (!sidebarOpen) return;
    const indicator = indicatorTL.current;
    indicator && indicator[playing ? "reverse" : "play"]();
  }, [playing, sidebarOpen]);
  return (
    <AnimatePresence mode="wait" propagate={true}>
      {track && (
        <m.div
          key={track.id}
          className={cn(
            "group relative flex aspect-square w-[20rem] items-center justify-center overflow-hidden rounded-full"
          )}
          ref={lpWrapperRef}
          data-playing={playing}
        >
          <Button
            onClick={toggle}
            className="z-[34] flex w-fit items-center justify-center rounded-md opacity-90 mix-blend-exclusion transition-colors duration-300 ease-out-power3 hover:text-rouge-300"
            style={{
              borderColor: "currentcolor"
            }}
          >
            <svg
              className={"h-[30px] w-[30px]"}
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                ref={pathRef}
                d={playIcon}
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              ></path>
            </svg>
          </Button>
          <svg xmlns="http://www.w3.org/2000/svg" height="0" width="0">
            <defs>
              <clipPath id="lp">
                <path d="M150 0C67.16 0 0 67.16 0 150s67.16 150 150 150 150-67.16 150-150S232.84 0 150 0m0 196.22c-25.53 0-46.22-20.7-46.22-46.22s20.7-46.22 46.22-46.22 46.22 20.7 46.22 46.22-20.7 46.22-46.22 46.22" />
              </clipPath>
              <clipPath id="lp-inner">
                <path d="M150 103.78c-25.53 0-46.22 20.7-46.22 46.22s20.7 46.22 46.22 46.22 46.22-20.7 46.22-46.22-20.7-46.22-46.22-46.22m0 51.22c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5" />
              </clipPath>
            </defs>
          </svg>
          <div
            className={
              // "absolute flex aspect-square w-[167px] items-center justify-center rounded-full bg-transparent shadow-md/30"
              "absolute flex aspect-square w-[20rem] items-center justify-center rounded-full bg-transparent"
            }
          >
            <Image
              src={sheenImage}
              alt="LP Sheen"
              className="absolute inset-0 z-[13] object-cover opacity-30 mix-blend-darken backdrop-brightness-70"
              ref={innerRef}
            />
            <div
              className="outline-groove absolute flex aspect-square w-full items-center justify-center overflow-hidden rounded-full outline-1"
              // style={{
	            //   outlineColor: "var(--bleu-400)/.25)"
              // }}
            >
              <Image
                className={cn(
                  "absolute inset-0 z-[2] block aspect-square rounded-full object-cover"
                )}
                src={lpImage}
                alt="an image of an lp"
              />
              <div
                // className="absolute inset-0 z-[13] flex aspect-square h-full w-full rounded-full bg-radial/oklab from-bleu-900 from-0% via-piercing-orange/50 via-25% to-bleu-700 to-40% mask-[url(/assets/textures/lp/lp_inner_grooves_1.png)] mask-alpha mask-size-[100%] mask-position-[center_center] mask-no-repeat opacity-40 mix-blend-color-burn min-lg:mask-[url(/assets/textures/lp/lp_inner_grooves_1@2x.png)]"
                className="absolute inset-0 z-[13] flex aspect-square h-full w-full rounded-full"
              />
              <div
                className={"absolute inset-0 z-[11] aspect-square rounded-full"}
                ref={lpRef}
              >
                {/* <div
              className={
                "absolute inset-0 z-[2] aspect-square rounded-full bg-[url(/assets/textures/lp/lp_svg.png)] mask-[url(/assets/textures/lp/lp_grooves_op75.png)] bg-auto bg-position-[center_center] bg-no-repeat mask-alpha mask-size-[100%] mask-position-[50%_50%] mask-no-repeat opacity-75 bg-blend-overlay mix-blend-multiply !outline-bleu-500/25 min-lg:bg-[url(/assets/textures/lp/lp_svg@2x.png)] min-lg:mask-[url(/assets/textures/lp/lp_grooves_op75@2x.png)]"
              }
            /> */}

                {/* <div className="absolute inset-0 z-[2] flex aspect-square items-center justify-between rounded-full bg-bleu-500/20 mask-[url(#lp)] mask-alpha mask-size-[100%] mask-position-[center_center] mask-no-repeat text-[1.8rem] opacity-95"></div> */}

                <div className="relative z-[11] h-full w-full font-siegfried leading-[1]">
                  {track.artist === artist && (
                    <m.div
                      initial={{ opacity: 0 }}
                      animate={{
                        opacity: 1,
                        transition: { duration: 0.4, ease: "easeOut" }
                      }}
                      exit={{
                        opacity: 0,
                        transition: {
                          duration: 0.3,
                          ease: "easeOut"
                        }
                      }}
                      transition={{ type: "tween" }}
                      className="absolute top-1/2 left-[1px] flex w-[25%] translate-y-[-50%] items-center justify-center text-center text-[1.2rem] font-bold tracking-[-.01em] italic opacity-90"
                      ref={trackArtist}
                    >
                      {artist}
                    </m.div>
                  )}
                  <m.div className="absolute top-1/2 right-0 flex w-[25%] translate-y-[-50%] items-center justify-center text-center text-[14px] font-black text-orange-200/90 italic">
                    2024
                  </m.div>
                </div>
                <div className="absolute top-0 right-0 bottom-auto left-0 z-[11] mt-[1.5rem] w-full transform-[.9] bg-transparent text-center leading-[1.1] font-normal">
                  <div className="relative mb-[.18rem] flex items-center justify-center overflow-hidden pb-[1.2px]">
                    {track.album === album && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 0.9,
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                        exit={{
                          opacity: 0,
                          transition: {
                            duration: 0.3,
                            ease: "easeOut"
                          }
                        }}
                        transition={{ type: "tween" }}
                        className="font-sans text-[.65rem] font-medium tracking-[.02rem] opacity-90"
                        ref={trackAlbum}
                      >
                        {album}
                      </m.div>
                    )}
                  </div>
                  <div className="relative z-[11] overflow-hidden pb-[1.2px]">
                    {track.title === title && (
                      <m.div
                        initial={{ opacity: 0 }}
                        animate={{
                          opacity: 0.9,
                          transition: { duration: 0.4, ease: "easeOut" }
                        }}
                        exit={{
                          opacity: 0,
                          transition: {
                            duration: 0.3,
                            ease: "easeOut"
                          }
                        }}
                        transition={{ type: "tween" }}
                        className="font-serif text-[14px] leading-[1] font-extrabold italic opacity-90"
                        ref={trackTitle}
                      >
                        {title}
                      </m.div>
                    )}
                  </div>
                </div>
                <m.div className="absolute top-auto right-0 bottom-0 left-0 z-[11] mb-[1.8rem] flex w-full scale-[.83] flex-col items-center justify-center gap-0 bg-transparent text-center font-sans font-medium opacity-90">
                  <span className="text-[.55rem] tracking-tighter">
                    The Hideaway
                  </span>
                  <span className="text-[0.5rem] tracking-tight">
                    a Restored Project
                  </span>
                </m.div>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
};
//
// const LP_Layered = ({
//   isMobile,
//   curIn,
//   trackArtist,
//   trackAlbum,
//   trackTitle,
//   lpRef,
// }: {
//   isMobile: boolean;
//   curIn: { title: string; artist: string; album: string };
//   trackArtist: HTMLDivElement;
//   trackAlbum: HTMLDivElement;
//   trackTitle: HTMLDivElement;
//   lpRef: HTMLDivElement;
// }) => {
//   <>
//     return{" "}
//     <div
//       className={
//         "opacity-40 bg-faded-black/10 rounded-full aspect-square w-[250px] absolute flex items-center justify-center z-[33]"
//       }
//       style={{
//         backgroundImage: `url(assets/textures/lp/lp_gradient_effects_bo${isMobile ? "" : "@2x"}.png)`,
//         backgroundSize: "auto",
//
//         backgroundPosition: "center center",
//
//         backgroundRepeat: "no-repeat",
//         mixBlendMode: "screen",
//       }}
//     ></div>
//     <div
//       className={
//         "shadow-md/30 rounded-full aspect-square w-[250px] absolute flex items-center justify-center bg-transparent"
//       }
//     >
//       <div
//         className="absolute flex rounded-full items-center justify-center w-[99%] outline-1 outline-groove aspect-square"
//         style={{ outlineColor: "var(---bleu-400)/.5)" }}
//         ref={lpRef}
//       >
//         <div
//           className="flex bg-radial/oklab opacity-40 from-bleu-900 from-0% via-piercing-orange/50 via-25% to-bleu-700 to-40% mix-blend-color-burn absolute inset-0 w-full h-full aspect-square rounded-full z-[13]"
//         style={{ outlineColor: "var(---bleu-400)/.5)",
//             maskImage: `url(/assets/textures/lp/lp_inner_grooves${isMobile ? "" : "@2x"}.png)`,
//             maskSize: "300px",
//             scale: 0.75,
//             maskPosition: "center center",
//             maskRepeat: "no-repeat",
//             maskMode: "alpha",
//           }}
//         ></div>
//         <div
//           className="flex items-center justify-between text-[1.8rem] bg-bleu-500/20 opacity-95 absolute inset-0 aspect-square rounded-full z-[2]"
//  //         style={{ outlineColor: "var(---bleu-400)/.5)" ,
//             maskImage: "url(#lp)",
//             maskSize: "100%",
//             maskPosition: "center center",
//             maskRepeat: "no-repeat",
//             maskMode: "alpha",
//           }}
//         ></div>
//
//         <div className="text-md font-italic opacity-95 absolute inset-0 w-full aspect-square rounded-full bg-transparent">
//           <div className={"relative"}>
//             <div
//               className=" z-[2] absolute inset-0 w-full aspect-square rounded-full opacity-95"
//               style={{
//                 maskImage: `url(assets/textures/lp/lp_effects${isMobile ? "" : "@2x"}.png), url(/assets/textures/lp/lp_grooves_op75${isMobile ? "" : "@2x"}.png)`,
//                 maskSize: "auto, 100%",
//                 maskPosition: "50% 50%, 50% 50%",
//                 maskMode: "alpha",
//                 maskRepeat: "no-repeat",
//                 maskComposite: "intersect",
//               }}
//             ></div>
//           </div>
//           <div
//             className={
//               "aspect-square w-full absolute py-[1.2rem] px-[1rem] tracking-[.06rem] text-bleu-300 flex rounded-full z-[2] opacity-95"
//             }
//             style={{
//               backgroundImage: `url(assets/textures/lp/lp_grooves_gradient_bo${isMobile ? "" : "@2x"}.png)`,
//               backgroundSize: "100%",
//               backgroundPosition: "50% 50%",
//               backgroundRepeat: "no-repeat",
//
//               mixBlendMode: "exclusion",
//             }}
//           >
//             <div className="w-full h-full relative leading-[1] font-siegfried">
//               <div
//                 className="text-[16px] tracking-[-.01em] -left-1 w-[25%] flex items-center justify-center opacity-85 absolute text-center font-bold italic mix-blend-exclusion top-1/2 translate-y-[-50%]"
//                 ref={trackArtist}
//               >
//                 {curIn.artist}
//               </div>
//               <div className="text-orange-100/90 flex items-center justify-center w-[25%] text-[19px] font-black italic text-center absolute top-1/2 translate-y-[-50%] right-0">
//                 2024
//               </div>
//             </div>
//             <div className="opacity-[.85] text-center w-full mt-[2.2rem] font-normal leading-[1.1] absolute top-0 bottom-auto left-0 right-0 transform-[.9] bg-transparent z-[1]">
//               <div className="justify-center items-center mb-[.3rem] pb-[2px] flex overflow-hidden relative">
//                 <div
//                   className="text-[.85rem] tracking-[.02rem] font-medium font-sans opacity-90"
//                   ref={trackAlbum}
//                 >
//                   {curIn.album}
//                 </div>
//               </div>
//               <div className="overflow-hidden pb-[2px] relative z-[2]">
//                 <div
//                   className="text-2xl font-serif italic leading-[1] font-bold"
//                   ref={trackTitle}
//                 >
//                   {curIn.title}
//                 </div>
//               </div>
//             </div>
//             <div className="opacity-90 text-center flex-col gap-0  bg-transparent justify-center items-center w-full mb-[3rem] flex absolute top-auto bottom-0 left-0 right-0 scale-[.83] font-medium font-sans z-[2]">
//               <span className="tracking-tighter text-[.7rem]">
//                 The Hideaway
//               </span>
//               <span className="tracking-tight text-[0.6rem]">
//                 a Restored Project
//               </span>
//             </div>
//             <div></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   </>;
// };
type RP_RadioProps = {};
export const RP_Radio = ({}: RP_RadioProps) => {
  const { isMobile } = useIsMobile();
  const { playing } = useRadio();
  const trackStatus = useRadioStore((t) => t.trackStatus);
  const tracks = useRadioStore((t) => t.tracks);
  const currentIndex = useRadioStore((t) => t.currentIndex);
  const [currentTrack, setCurrentTrack] = useState(
    tracks?.[currentIndex] || BASETRACK
  );
  const { title: baseTrack, album: baseAlbum, artist: baseArtist } = BASETRACK;
  const [title, setTitle] = useState<string>(currentTrack.title);
  const [album, setAlbum] = useState<string>(currentTrack.album);
  const [artist, setArtist] = useState<string>(currentTrack.artist);
  useEffect(() => {
    if (tracks && tracks.length > 0) {
      const io = tracks[currentIndex];
      io && setCurrentTrack(io);
    }
  }, [tracks, currentIndex]);
  useEffect(() => {
    const io = currentTrack;
    (setTitle(io.title), setAlbum(io.album), setArtist(io.artist));
  }, [currentTrack]);
  const titleRef = useRef<HTMLDivElement>(null!);
  const artistRef = useRef<HTMLDivElement>(null!);
  const albumRef = useRef<HTMLDivElement>(null!);
  const key1 = useMemo(nanoid, []);
  return (
    <AnimatePresence propagate={true} initial={true}>
      <m.div
        key={key1}
        className="flex h-full w-full flex-col items-center justify-center gap-5 py-4 pr-2 pl-7 text-bleu-200"
      >
        <div className="flex flex-col gap-2">
          {artist === currentTrack.artist && (
            <m.span className="text-lg font-bold" ref={artistRef}>
              {artist}
            </m.span>
          )}
          <span
            className="text-xl leading-[1] font-medium tracking-tight"
            ref={titleRef}
          >
            {title}
          </span>
        </div>
      </m.div>
    </AnimatePresence>
  );
};
type Props = {
  className?: string;
  timerClassName?: string;
};
const padWithLeadingZeros = (num: number, length: number): string => {
  return String(num).padStart(length, "0");
};

/****
          <style>
            {`
              [data-lp-effects] {
              --scanlines-space: 1px;
    --scanlines-light: #666;
    --scanlines-dark: black;
    --bars: 3%;
    --bar-color: oklch(from var(--faded-fg) l c h/1);
    --bar-bg: var(--faded-black);
    
              -pointer-x: 50%;
    --pointer-y: 50%;
    --pointer-from-center: 0;
    --pointer-from-top: 0.5;
    --pointer-from-left: 0.5;
    --card-opacity: 0;
    --rotate-x: 0deg;
    --rotate-y: 0deg;
    --background-x: 50%;
    --background-y: 50%;
    --card-scale: 1;
    --translate-x: 0px;
    --translate-y: 0px;
          --scanlines-space: 1px;
    --scanlines-light: var(--faded-white);
    --scanlines-dark: var(--faded-black);
    --bars: 3%;
    --bar-color: var(--faded-white);
      --bar-bg: var(--faded-black);
              }
            `}
          </style>

<div data-lp-effects={true} style={{

            maskImage: "url(/assets/lp_effects.png)",
            maskSize: "100%",
            maskPosition: "center center",
            maskRepeat: "no-repeat",
            maskMode: "alpha",
            width: "100%",
            position: "absolute",
            inset: 0,
            zIndex: 2,
            aspectRatio: "1/1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "repeating-linear-gradient(110deg, var(--color-purple-500), var(--color-blue-500), var(--color-green-500), var(--color-yellow-500), var(--color-red-500), var(--color-purple-500), var(--color-blue-500), var(--color-green-500), var(--color-yellow-500), var(--color-red-500), var(--color-purple-500), var(--color-blue-500), var(--color-green-500), var(--color-yellow-500), var(--color-red-500)",
            backgroundPosition: "calc(((50% - var(--background-x)) * 2.6) + 50%) calc(((50% - var(--background-y)) * 3.5) + 50%)",
            backgroundSize: "400% 400%",
            backgroundBlendMode: "overlay",
            filter: "brightness(1.3) contrast(1.1) saturate(1.2)",
            mixBlendMode: "color-dodge"
          }}>
            <div data-lp-effects={true} style={{

              backgroundImage: "repeating-linear-gradient(90deg, var(--bar-bg) calc(var(--bars) * 2), var(--bar-color) calc(var(--bars) * 3), var(--bar-bg) calc(var(--bars) * 3.5), var(--bar-color) calc(var(--bars) * 4), var(--bar-bg) calc(var(--bars) * 5), var(--bar-bg) calc(var(--bars) * 14)), repeating-linear-gradient(90deg, var(--bar-bg) calc(var(--bars) * 2), var(--bar-color) calc(var(--bars) * 3), var(--bar-bg) calc(var(--bars) * 3.5), var(--bar-color) calc(var(--bars) * 4), var(--bar-bg) calc(var(--bars) * 5), var(--bar-bg) calc(var(--bars) * 10))",
              backgroundPosition: "calc((((50% - var(--background-x)) * 1.65) + 50%) + (var(--background-y) * 0.5)) var(--background-x), calc((((50% - var(--background-x)) * -0.9) + 50%) - (var(--background-y) * 0.75)) var(--background-y)",
              backgroundSize: "200% 200%, 200% 200%",
              backgroundBlendMode: "screen",
              filter: "brightness(1.15) contrast(1.1)",
              mixBlendMode: "hard-light",
            }}></div>
            <div className="absolute inset-0 rounded-full z-[2] w-full flex items-center justify-center aspect-square" data-lp-effects={true} style={{
              maskImage: "url(/assets/lp_effects.png)",

              backgroundImage: "radial-gradient(farthest-corner circle at var(--pointer-x) var(--pointer-y), oklch(from var(--faded-white) l c h/0.8) 0%, oklch(from var(--faded-white) l c h/0.78) 25%, oklch(from var(--faded-black) l c h/0.9) 90%)",
              backgroundPosition: "center center",
              backgroundSize: "cover",
              mixBlendMode: "luminosity",
              filter: "brightness(0.6) contrast(4)",

              maskSize: "cover",
              maskPosition: "center center",
              maskRepeat: "no-repeat",
              maskMode: "alpha",

              transition: "all .33s ease",
            }}></div>
            
            </div>
 */
