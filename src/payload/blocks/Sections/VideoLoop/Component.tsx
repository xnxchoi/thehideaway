// 'use client'
// import type {
//   ComponentProps,
//   ComponentPropsWithRef,
//   Dispatch,
//   HTMLAttributes,
//   SetStateAction,
// } from 'react'
// import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
//
// import { useIsReducedMotion } from '@/hooks/reducedMotion'
// import { useInView } from '@/hooks/useInView'
// import { useIsMobile } from '@/providers/MiddleMan'
// import { cn } from '@/lib/utils'
// import { Footer, Media } from '@/payload-types'
// import { getDeviceInfo } from '@/providers/RP_Pro'
// import { useWindowResize } from '@/utilities/use_window_resize'
//
// const use_get_video_src = (props: { videoLoop?: { desktop?: Media; mobile?: Media } }) => {
//   const { videoLoop } = props
//
//   const { isMobile } = useIsMobile()
//   const [videoSrc, setVideoSrc] = useState<{ url: string; filename: string }>(null!)
//
//   const mobileSizeMb = 60,
//     desktopSizeMb = 120
//
//   if (!videoLoop || !videoLoop.desktop || !videoLoop.mobile) return
//   if (typeof videoLoop.mobile === 'string' || typeof videoLoop.desktop === 'string') return
//   if (!videoLoop.mobile.filesize || !videoLoop.desktop.filesize) return
//
//   videoLoop.mobile &&
//     setVideoSrc({
//       url: videoLoop.mobile.url ?? '',
//       filename: videoLoop.mobile.filename ?? '',
//     })
//
//   return { videoSrc }
// }
//
// export type RPVideoLoop = ComponentProps<'video'> & {
//   getElement: () => HTMLVideoElement | null
//   forceIsPlaying: (l: boolean) => void
//   playVideo: () => void
//   stopVideo: () => void
//   loadVideo: () => void
//   desktopSizeMb?: number
//   mobileSizeMb?: number
//   videoLoop?: Footer['videoLoop']
//   disableInView?: boolean
//   initiallyStopped?: boolean
//   className?: string
//   videoIntervalCheckMs?: number
//   videoShowDuration?: string
//   id?: string
//   coverTarget?: string | HTMLElement
//   onShow?: () => void
//   onCanPlay?: () => void
//   onLoadedMetadata?: () => void
//   style?: HTMLAttributes<HTMLAttributes<HTMLMediaElement>>['style'] & {
//     '--video-show-duration': string
//     '--video-width': string
//     '--video-height': string
//     '--video-top-offset': string
//     '--video-left-offset': string
//   }
// }
//
// export const VideoLoop = (props: RPVideoLoop) => {
//   const devInfo = getDeviceInfo()
//   const {
//     videoLoop,
//     desktopSizeMb,
//     mobileSizeMb,
//     disableInView,
//     initiallyStopped,
//     className,
//     videoIntervalCheckMs = 20,
//     videoShowDuration = '0.3s',
//     id,
//     coverTarget,
//     onShow,
//     onCanPlay,
//     onLoadedMetadata,
//   } = props
//   const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null!)
//   const { setElementToObserve, isInView } = useInView({
//     fireOnce: !1,
//     scrolltriggerStart: 'top-=1200px bottom',
//     scrolltriggerEnd: 'bottom+=200px top',
//   })
//   const videoRef = useRef<HTMLVideoElement>(null!)
//   const [isVideoVisible, setVideoVisibility] = useState(!1)
//   const isFireFox = devInfo.browser.name === 'firefox'
//   const currentPlayingRef = useRef(!1)
//   const isPaused = useRef<boolean>(false)
//   const { isReducedMotion } = useIsReducedMotion()
//   const useResize = useWindowResize()
//   const [videoSrc, setVideoSrc] = useState<{ url: string; filename: string }>(null!)
//   const [videoElementDimensions, setVideoElementDimensions] = useState({
//     w: 0,
//     h: 0,
//   })
//   const [coverTargetDimensions, setCoverTargetDimensions] = useState({
//     w: 0,
//     h: 0,
//   })
//   const [videoDimensions, setVideoDimensions] = useState({
//     w: 0,
//     h: 0,
//     topOffset: 0,
//     leftOffset: 0,
//   })
//   const { isMobile } = useIsMobile()
//   const describedByRef = useRef(
//     'described_by_'.concat(''.concat(`${Math.random()}`).replace('.', '')),
//   )
//   const [curAlt, setAlt]: [string | null, Dispatch<SetStateAction<string | null>>] = useState(null)
//   let er
//
//   useEffect(() => {
//     isMobile &&
//       videoLoop &&
//       (videoLoop.desktop == null
//         ? void 0
//         : videoLoop.mobile &&
//           typeof videoLoop.mobile === 'object' &&
//           videoLoop.mobile.alt &&
//           setAlt(videoLoop.mobile.alt)),
//       !isMobile &&
//         (videoLoop?.desktop == null
//           ? void 0
//           : videoLoop.desktop &&
//             typeof videoLoop.desktop === 'object' &&
//             videoLoop.desktop.alt &&
//             setAlt(videoLoop.desktop.alt))
//   }, [isMobile, videoLoop])
//   const getCoverTargetCallback = useCallback(() => {
//     let l: HTMLElement | null = null
//     return (
//       typeof coverTarget === 'string' &&
//         (l = document.querySelectorAll(''.concat(coverTarget))[0] as HTMLElement),
//       coverTarget instanceof HTMLElement && (l = coverTarget),
//       l
//     )
//   }, [coverTarget])
//   const playVideoCallback = useCallback(async () => {
//     videoRef.current &&
//       er &&
//       !isPaused.current &&
//       videoRef.current.paused &&
//       !currentPlayingRef.current &&
//       ((videoRef.current.src = ''),
//       await videoRef.current.load(),
//       (videoRef.current.src = er.url as string),
//       await videoRef.current.load(),
//       (videoRef.current.currentTime = 0),
//       await videoRef.current.play(),
//       (currentPlayingRef.current = !0),
//       isReducedMotion && ((videoRef.current.currentTime = 0.5), await videoRef.current.pause()))
//   }, [er, isReducedMotion])
//   const loadVideoCallback = useCallback(async () => {
//     videoRef.current &&
//       er &&
//       !isPaused.current &&
//       videoRef.current.paused &&
//       !currentPlayingRef.current &&
//       ((videoRef.current.src = ''),
//       await videoRef.current.load(),
//       (videoRef.current.src = er.url as string),
//       await videoRef.current.load())
//   }, [er])
//   const stopVideoCallback = useCallback(async () => {
//     videoRef.current &&
//       !isPaused.current &&
//       !videoRef.current.paused &&
//       currentPlayingRef.current &&
//       (await videoRef.current.pause(),
//       (videoRef.current.src = ''),
//       await videoRef.current.load(),
//       (currentPlayingRef.current = !1))
//   }, [])
//   useEffect(() => {
//     if (initiallyStopped) return
//     if (isFireFox) {
//       playVideoCallback()
//       return
//     }
//     const fire = async () => {
//       videoRef.current && (isInView || disableInView ? playVideoCallback() : stopVideoCallback())
//     }
//     fire()
//   }, [
//     er,
//     isInView,
//     disableInView,
//     playVideoCallback,
//     stopVideoCallback,
//     isFireFox,
//     initiallyStopped,
//   ])
//   useEffect(() => {
//     if (isFireFox) {
//       setVideoVisibility(!0)
//       return
//     }
//     if (!disableInView) {
//       const l = getCoverTargetCallback()
//       coverTarget && l ? setElementToObserve(l) : setElementToObserve(videoRef.current)
//     }
//     if (
//       (timeoutRef.current && clearInterval(timeoutRef.current),
//       disableInView && setVideoVisibility(!0),
//       initiallyStopped)
//     ) {
//       setVideoVisibility(!0)
//       return
//     }
//     isInView &&
//       (timeoutRef.current = setInterval(() => {
//         let l
//         videoRef.current &&
//           (((l = videoRef.current) === null || void 0 === l ? void 0 : l.currentTime) > 0
//             ? (setVideoVisibility(!0),
//               onShow && onShow(),
//               timeoutRef.current && clearInterval(timeoutRef.current))
//             : setVideoVisibility(!1))
//       }, videoIntervalCheckMs))
//   }, [
//     onShow,
//     er,
//     isInView,
//     disableInView,
//     setElementToObserve,
//     isFireFox,
//     videoIntervalCheckMs,
//     initiallyStopped,
//     getCoverTargetCallback,
//     coverTarget,
//   ])
//   useEffect(
//     () => () => {
//       timeoutRef.current && clearInterval(timeoutRef.current), (isPaused.current = !0)
//     },
//     [],
//   )
//   useEffect(() => {
//     if (!coverTarget) return
//     const l = getCoverTargetCallback()
//     l &&
//       setCoverTargetDimensions({
//         w: l.offsetWidth,
//         h: l.offsetHeight,
//       })
//   }, [coverTarget, useResize, er, videoLoop, isMobile, setElementToObserve, getCoverTargetCallback])
//   useEffect(() => {
//     if (
//       !coverTargetDimensions.w ||
//       !coverTargetDimensions.h ||
//       !videoElementDimensions.w ||
//       !videoElementDimensions.h
//     )
//       return
//     const l = coverTargetDimensions.w / coverTargetDimensions.h
//     const c = videoElementDimensions.w / videoElementDimensions.h
//     let d = 0
//     let h = 0
//     let p = 0
//     let m = 0
//     l > c &&
//       ((d = coverTargetDimensions.w),
//       (m = -(((h = coverTargetDimensions.w / c) - coverTargetDimensions.h) * 0.5))),
//       l <= c && (p = -(((d = (h = coverTargetDimensions.h) * c) - coverTargetDimensions.w) * 0.5)),
//       setVideoDimensions({
//         w: d,
//         h,
//         leftOffset: p,
//         topOffset: m,
//       })
//   }, [
//     coverTargetDimensions.w,
//     coverTargetDimensions.h,
//     videoElementDimensions.w,
//     videoElementDimensions.h,
//     useResize,
//     isMobile,
//     er,
//   ])
//   useImperativeHandle(vLoopRef, () => ({
//     getElement: () => videoRef.current,
//     forceIsPlaying: (l) => {
//       currentPlayingRef.current = l
//     },
//     playVideo: playVideoCallback,
//     stopVideo: stopVideoCallback,
//     loadVideo: loadVideoCallback,
//   }))
//
//   useEffect(() => {
//     const { current: video } = videoRef
//     if (video) {
//       video.addEventListener('suspend', () => {
//         // setShowFallback(true);
//         // console.warn('Video was suspended, rendering fallback image.')
//       })
//     }
//   }, [])
//
//   const { filename } = videoSrc
//   return (
//     <video
//       onCanPlay={() => onCanPlay && onCanPlay()}
//       ref={videoRef}
//       muted={!0}
//       playsInline={!0}
//       loop={!0}
//       onLoadedMetadata={() => {
//         videoRef.current &&
//           (setVideoElementDimensions({
//             w: videoRef.current.videoWidth,
//             h: videoRef.current.videoHeight,
//           }),
//           onLoadedMetadata && onLoadedMetadata())
//       }}
//       onPlaying={() => {
//         currentPlayingRef.current = !0
//       }}
//       onPause={() => {
//         currentPlayingRef.current = !1
//       }}
//       id={id}
//       src={videoSrc.url}
//       className={cn(
//         'videoloop',
//         className,
//         { visuallyShowVideo: isVideoVisible },
//         {
//           coverTargetDimensions:
//             coverTargetDimensions.h &&
//             coverTargetDimensions.w &&
//             ((isMobile && isMobile !== null) || !1),
//         },
//       )}
//       style={{
//         //@ts-ignore
//         '--video-show-duration': videoShowDuration,
//         '--video-width': ''.concat(`${videoDimensions.w}px`),
//         '--video-height': ''.concat(`${videoDimensions.h}px`),
//         '--video-top-offset': ''.concat(`${videoDimensions.topOffset}px`),
//         '--video-left-offset': ''.concat(`${videoDimensions.leftOffset}px`),
//       }}
//       {...(curAlt && describedByRef.current ? { 'aria-describedby': describedByRef.current } : {})}
//     />
//   )
// }
