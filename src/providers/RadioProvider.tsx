/* eslint-disable @typescript-eslint/no-this-alias */
"use client"

import {
	createContext, ReactNode, useContext, useCallback, useEffect, useMemo, useRef, useState
} from "react"
import {createRadioStore, RadioStore, type RP_Track} from "@/stores/Radio/Radio"
import {useStore} from "zustand"
import {Howl} from "howler"
import {parseWebStream} from "music-metadata"
import {createCuid} from "@/utilities/stringUtilities"

type RadioInternalAPI = ReturnType<typeof createRadioStore>
const InternalRadioContext = createContext<RadioInternalAPI | null>(null)

declare module "howler" {
	interface Howl {
		switchTrack: (options: HowlOptions) => void
	}
}
Howl.prototype.switchTrack = function (o) {
	const self = this
	self.unload()

	self._duration = 0 // init duration
	self._sprite = {} // init sprite
	self._src = typeof o.src !== "string" ? o.src : [o.src]
	self._format = typeof o.format !== "string" ? o.format : [o.format]
	self._autoplay = false

	self._loop = false
	self._html5 = true

	self._preload = true
	self.load() // => update duration, sprite(var timeout)
}
Howler.autoUnlock = false
export const useRadioStore = <T, >(selector: (store: RadioStore) => T) => {
	const store = useContext(InternalRadioContext)
	if (!store) {
		throw new Error("useRadioStore must be used inside RadioProvider")
	}
	return useStore(store, selector)
}
export const useRadioAPI = () => {
	const store = useContext(InternalRadioContext)
	if (!store) {
		throw new Error("useRadioAPI must be used inside RadioProvider")
	}
	return store.subscribe
}
const RadioInternal = ({children}: { children: ReactNode }) => {
	const ref = useRef<RadioInternalAPI>(null)
	const tracks = [
		{
			id: createCuid(),
			title: "Shibuya Nights",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_1.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 2",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_2.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 3",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_3.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 4",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_4.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 5",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_5.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 6",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_6.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 7",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_7.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 8",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_8.ogg`,
			artist: "YM.FM",
		},
		{
			id: createCuid(),
			title: "Part 9",
			url: `${process.env.NEXT_PUBLIC_SERVER_URL}/track_media/Track_9.ogg`,
			artist: "YM.FM",
		},
	]
	const fetchTracks = async () => {

		const racks = tracks
		const radioTracks: RP_Track[] = []
		if (Array.isArray(racks)) {
			for (const r of racks) {
				if (r && typeof r === "object") {
					const {id, url} = r
					if (!url) continue
					const strt = await fetch(url, {
						headers: {
							"Content-Type": "audio/ogg",
						},
					})
					const webStream = strt.body
					// Parse the metadata from the web stream
					if (!webStream) continue
					const metadata = await parseWebStream(webStream, 'audio/ogg')
					console.log(metadata)
					const {title, artist, album} = metadata.common || {}
					if (!id || !title || !url || !artist) continue
					radioTracks.push({
						id,
						title,
						album: album || 'hideaway sessions',
						url,
						artist,
					})
				}
			}
		}
		return radioTracks

	}
	const [hasRadio, setHasRadio] = useState(false)
	useEffect(() => {

		!ref.current && fetchTracks().then((tracks) => {
			ref.current = createRadioStore({
				tracks,
				trackLength: tracks.length,
				currentIndex: 0,
				currentTrack: tracks[0] || null!,
				crossFading: false,
				playing: false,
				trackStatus: "paused",
				elapsedTime: 0,
				remainingTime: 12220,
				hasRadio: tracks.length > 2,
				currentTrackInfo: {
					title: tracks[0]?.title || "",
					artist: tracks[0]?.artist || "",
					album: tracks[0]?.album || "",
				},
			})
		}).then(() => {
			setHasRadio(true)
		})

	}, [])

	return (
		<InternalRadioContext.Provider value={ref.current}>
			{hasRadio && (<RadioOuterProvider>{children}</RadioOuterProvider>)}
		</InternalRadioContext.Provider>
	)
}
const DEFAULT_THRESHOLD_SECONDS = 3 //3 seconds
const DEFAULT_THRESHOLD_MS = DEFAULT_THRESHOLD_SECONDS * 1000
const DEFAULT_FADE_DURATION_MS = 300 //300ms
const DEFAULT_TRANSITION_DURATION_MS = DEFAULT_THRESHOLD_MS / 2
export type TrackRP = {
	h: Howl
	trackIndex: number
	uuid: string
}
type RadioOuterState = {
	setPlaying: () => void
	setPaused: () => void
	currentTrackPlayer: TrackRP
	toggle: () => void
	playing: boolean
	setCurrentTrack: (index: number) => void
}

const RadioOuterContext = createContext<RadioOuterState | null>(null)
/**
 * The implementation layer of the RP_FM API.
 * To minimize the hassle of dealing with the inherent complexities in managing audio, I have decided to bake the tracks into the params.
 * Now this will be hydrated only when we have more than **2 tracks** available in our playlist.
 * @todo this will inevitably introduce headaches.
 */
const RadioOuterProvider = ({children}: { children: ReactNode }) => {
	const defaultHowlOptions = useMemo(
		() => ({
			html5: true,
			preload: true,
			pool: 25,
			loop: false,
			volume: 1.0,
			autoplay: false,
			format: ["ogg"],
		}),
		[],
	)

	// const tracks = useRadioStore((t) => t.tracks);
	const setPlaying = useRadioStore((t) => t.setPlaying)
	const playing = useRadioStore((t) => t.playing)
	const currentIndex = useRadioStore((t) => t.currentIndex)
	const currentTrack = useRadioStore((t) => t.currentTrack)
	const setCurrentTrack = useRadioStore((t) => t.setCurrentTrack)
	const toggle = useRadioStore((t) => t.toggle)
	const setPaused = useRadioStore((t) => t.setPaused)
	const setTrackTime = useRadioStore((t) => t.setTrackTime)
	const cleanTrack = useRadioStore((t) => t.cleanTrack)
	const setHasRadio = useRadioStore((t) => t.setHasRadio)
	const hasRadio = useRadioStore((t) => t.hasRadio)
	const [refreshing, setRefreshing] = useState(false)
	const tracks = useRadioStore((t) => t.tracks)
	const setTrackStatus = useRadioStore((t) => t.setTrackStatus)
	const trackStatus = useRadioStore((t) => t.trackStatus)
	const setPlay = useCallback(
		() => setTrackStatus("playing"),
		[setTrackStatus],
	)
	const setPause = useCallback(
		() => setTrackStatus("paused"),
		[setTrackStatus],
	)
	const setEnd = useCallback(() => setTrackStatus("ended"), [setTrackStatus])
	const setLoad = useCallback(
		() => setTrackStatus("loading"),
		[setTrackStatus],
	)
	const setError = useCallback(() => setTrackStatus("error"), [setTrackStatus])
	const observeTrackStatus = useCallback(
		(h: Howl) => {
			h.on("play", setPlay)
			h.on("pause", setPause)
			h.on("end", setEnd)

			setTrackStatus(h.playing() ? "playing" : "paused")
			return () => {
				h.off("play", setPlay)
				h.off("pause", setPause)
				h.off("end", setEnd)
			}
		},
		[setPlay, setPause, setEnd, setError, setTrackStatus],
	)
	const unobserver = useRef<(() => void) | null>(null)

	const current = useRef<TrackRP>(null!)
	const next = useRef<TrackRP>(null!)

	const tracker = useRef<[TrackRP, TrackRP] | null>(null)

	useEffect(() => {
		if (!hasRadio) {
			return
		}
		const howl1 = {
			trackIndex: currentIndex,
			uuid: crypto.randomUUID(),
			h: new Howl({
				src: [currentTrack.url],
				...defaultHowlOptions,
				onplay: () => {
					howl1.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS)
				},
				onend: () => {
					howl1.h.unload()
				},
			}),
		}
		const howl2 = {
			trackIndex: (currentIndex + 1) % tracks.length,
			uuid: crypto.randomUUID(),
			h: new Howl({
				src: [tracks[(currentIndex + 1) % tracks.length]!.url],
				...defaultHowlOptions,
				onplay: () => {
					howl2.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS)
				},
				onend: () => {
					howl2.h.unload()
				},
			}),
		}
		tracker.current = [howl1, howl2]
		current.current = howl1
		next.current = howl2
		unobserver.current = observeTrackStatus(howl1.h)
	}, [hasRadio])

	const threshold = DEFAULT_THRESHOLD_SECONDS
	/**
	 * Unintentionally created a pretty nice structure akin to pointers in C
	 *
	 * The flow of {@link phasedCallback} is circular:
	 * PLAY-FADE_OUT-SWITCH-FADE_IN-PLAY
	 *
	 *
	 *
	 * **/
	const FADE_OUT = "fadeOut" as const
	const SWITCH = "switch" as const
	const FADE_IN = "fadeIn" as const
	const PLAY = "play" as const
	const phase = useRef<
		typeof FADE_OUT | typeof SWITCH | typeof FADE_IN | typeof PLAY
	>(PLAY)
	const timoutID = useRef<ReturnType<typeof setTimeout> | null>(null)
	const animationFrameID = useRef<ReturnType<
		typeof requestAnimationFrame
	> | null>(null)
	const clearTimout = useCallback(() => {
		if (timoutID.current) {
			clearTimeout(timoutID.current)
			timoutID.current = null
		}
	}, [])
	useEffect(() => {
		if (!tracker.current) {
			if (unobserver.current) {
				unobserver.current()
				unobserver.current = null
			}
			return
		}
		if (!current.current.h) {
			if (unobserver.current) {
				unobserver.current()
				unobserver.current = null
			}
			return
		}
		cleanTrack()

		const phasedCallback = () => {
			if (!tracker.current) {
				clearTimout()
				animationFrameID.current &&
				cancelAnimationFrame(animationFrameID.current)
				animationFrameID.current = null
				return
			}
			const duration = current.current.h.duration()
			if (!duration) {
				//duration is undefined if Howler is loading
				setTrackStatus("loading")
				animationFrameID.current = requestAnimationFrame(phasedCallback)
				return
			}
			const elapsed = current.current.h.seek()
			const remaining = duration - elapsed
			setTrackTime(elapsed, duration)

			if (phase.current === SWITCH) {
				clearTimout()
				phase.current = FADE_IN

				const nextIndex = (current.current.trackIndex + 1) % tracks.length
				const nextTrack = tracks[nextIndex]
				if (!nextTrack || !nextTrack.url) return

				next.current.h.switchTrack({
					src: [nextTrack.url],
					...defaultHowlOptions,
					onplay: () => {

						next.current.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS)
					},
					onend: () => {
						next.current.h.unload()
					},
				})
			} else if (phase.current === FADE_IN) {
				phase.current = PLAY
				clearTimout()
			} else {
				if (remaining < threshold) {
					if (phase.current === PLAY) {
						phase.current = FADE_OUT
						current.current.h.fade(1.0, 0.2, DEFAULT_TRANSITION_DURATION_MS)
						current.current.h.once("fade", () => {
							current.current.h.stop()
						})
						animationFrameID.current = requestAnimationFrame(phasedCallback)
						return
					} else if (phase.current === FADE_OUT) {
						//this is where critical operations take place

						if (!timoutID.current) {
							//ensure that timeOut is set only once per cycle
							timoutID.current = setTimeout(() => {
								phase.current = SWITCH
								clearTimout()
								const toLetGo = current.current
								unobserver.current && unobserver.current()
								unobserver.current = null
								current.current = next.current
								next.current = toLetGo
								if (next.current.h.playing()) {
									next.current.h.once("fade", () => {
										next.current.h.stop()
										next.current.h.unload()
										setCurrentTrack(current.current.trackIndex)
										unobserver.current = observeTrackStatus(current.current.h)
									})
									next.current.h.fade(1.0, 0.2, DEFAULT_FADE_DURATION_MS)
								} else {
									next.current.h.stop()
									next.current.h.unload()
									setCurrentTrack(current.current.trackIndex)
									unobserver.current = observeTrackStatus(current.current.h)
								}

								const dependsOnPlaying = () => {
									if (playing) {
										if (current.current.h.playing()) {
											return
										}
										current.current.h.play()
									} else {
										if (!current.current.h) return
										if (current.current.h.playing()) {
											current.current.h.once("fade", () => {
												current.current.h.pause()
											})
											current.current.h.fade(
												1.0,
												0.2,
												DEFAULT_FADE_DURATION_MS,
											)
										}
									}
								}

								dependsOnPlaying()
								animationFrameID.current =
									requestAnimationFrame(phasedCallback)

								return
							}, DEFAULT_TRANSITION_DURATION_MS)
						}
						return
					}
				}
			}
			animationFrameID.current = requestAnimationFrame(phasedCallback)
		}

		if (playing) {
			current.current.h.play()
			phasedCallback()
		} else {
			if (current.current.h.playing()) {
				current.current.h.once("fade", () => {
					current.current.h.pause()
				})
				current.current.h.fade(1.0, 0.2, DEFAULT_FADE_DURATION_MS)
			} else {
				current.current.h.pause()
			}

			clearTimout()
			animationFrameID.current &&
			cancelAnimationFrame(animationFrameID.current)
			animationFrameID.current = null
		}
	}, [playing])
	useEffect(() => {
		if (navigator && navigator.mediaSession) {
			navigator.mediaSession.setActionHandler("play", setPlaying)
			navigator.mediaSession.setActionHandler("pause", setPaused)
		}
	}, [])

	return (
		<RadioOuterContext.Provider value={{
			setPlaying,
			setPaused,
			playing,
			setCurrentTrack,
			toggle,
			currentTrackPlayer: current.current
		}}>
			{children}
		</RadioOuterContext.Provider>
	)
}
export const useRadio = () => {
	const outerCtx = useContext(RadioOuterContext)!
	if (!outerCtx) throw new Error("useRadio must be used inside RadioOuterProvider")
	return outerCtx
}
export const RadioProvider = ({children}: { children: ReactNode }) => {
	return <RadioInternal>{children}</RadioInternal>
}
