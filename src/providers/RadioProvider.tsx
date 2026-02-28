/* eslint-disable @typescript-eslint/no-this-alias */
"use client";

import {getRadio} from "@/providers/getRadio";
import {
	DEFAULT_FADE_DURATION_MS,
	DEFAULT_THRESHOLD_SECONDS,
	DEFAULT_TRANSITION_DURATION_MS
} from "@/providers/radioConstant";
import {readRadioTrack} from "@/providers/readRadioTrack";
import {createRadioStore, RadioStore, type RP_Track} from "@/stores/Radio/Radio";
import {Howl, HowlOptions} from "howler";
import {nanoid} from "nanoid";
import {
	createContext,
	ReactNode,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState
} from "react";
import {uuidv7} from "uuidv7";
import {useStore} from "zustand";
import {useShallow} from "zustand/shallow";

type RadioInternalAPI = ReturnType<typeof createRadioStore>;
const InternalRadioContext = createContext<RadioInternalAPI | null>(null);

declare module "howler" {
	interface Howl {
		switchTrack: (options: HowlOptions) => void;
		_duration: number;
		_sprite: Record<string, [number, number]>;
		_src: string[];
		_format?: string | string[] | undefined;
		_autoplay: boolean;
		_loop: boolean;
		_html5: boolean;
		_preload: boolean;
	}
}
Howl.prototype.switchTrack = function (o) {
	const self = this;
	self.unload();

	self._duration = 0; // init duration
	self._sprite = {}; // init sprite
	self._src = typeof o.src !== "string" ? o.src : [o.src];
	self._format = o.format;
	self._autoplay = false;

	self._loop = false;
	self._html5 = true;

	self._preload = true;
	self.load(); // => update duration, sprite(var timeout)
};
Howler.autoUnlock = false;
export const useRadioStore = <T, >(selector: (store: RadioStore) => T) => {
	const store = useContext(InternalRadioContext);
	if (!store) {
		throw new Error("useRadioStore must be used inside RadioProvider");
	}
	return useStore(store, selector);
};
export const useRadioAPI = () => {
	const store = useContext(InternalRadioContext);
	if (!store) {
		throw new Error("useRadioAPI must be used inside RadioProvider");
	}
	return store.subscribe;
};

const RadioInternal = ({children}: { children: ReactNode }) => {
	const ref = useRef<RadioInternalAPI>(null);

	const getTracks = useCallback(async ({title, extension = "ogg"}: {
		title: string;
		extension?: "ogg" | "mp3"
	}) => {
		const track = await fetch(`public/track_media/${title}.${extension}`, {
			headers: {
				"Content-Type": `audio/${extension}`
			}
		})
	}, [])
	const tracks = useMemo(
		() => [
			{
				id: uuidv7(),
				title: "Shibuya Nights",
				url: `/track_media/Track_1.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 2",
				url: `/track_media/Track_2.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 3",
				url: `/track_media/Track_3.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 4",
				url: `/track_media/Track_4.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 5",
				url: `/track_media/Track_5.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 6",
				url: `/track_media/Track_6.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 7",
				url: `/track_media/Track_7.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 8",
				url: `/track_media/Track_8.ogg`,
				artist: "YM.FM"
			},
			{
				id: uuidv7(),
				title: "Part 9",
				url: `/track_media/Track_9.ogg`,
				artist: "YM.FM"
			}
		],
		[]
	);
	const fetchTracks = useCallback(async () => {
		return await getRadio(tracks)
	}, [tracks]);
	const [hasRadio, setHasRadio] = useState(false);
	useEffect(() => {
		!ref.current &&
		getRadio(tracks)
			.then((trackes) => {
				console.log("tracks:", trackes)
				ref.current = createRadioStore({
					tracks: trackes,
					currentIndex: 0,
					crossFading: false,
					playing: false,
					trackStatus: "paused",
					elapsedTime: 0,
					remainingTime: trackes[0].duration,
					hasRadio: trackes.length > 2,
					playMode: "default",
					hasNext: trackes.length > 1,
					nextIndex: Math.min(1, trackes.length - 1),
					playbackRate: 1.0,
					seeking: false,
				});
			})
			.then(() => {
				setHasRadio(true);
			});
	}, [fetchTracks, tracks]);

	return (
		<InternalRadioContext.Provider value={ref.current}>
			{hasRadio && <RadioOuterProvider>{children}</RadioOuterProvider>}
		</InternalRadioContext.Provider>
	);
};

export type TrackRP = {
	h: Howl;
	trackIndex: number;
	uuid: string;
};
type RadioOuterState = {
	setPlaying: () => void;
	setPaused: () => void;
	currentTrackPlayer: TrackRP;
	toggle: () => void;
	playing: boolean;
	setCurrentTrack: (index: number) => void;
	skipToTrack: (index: number) => void;
	setPlaybackRate: (rate: number) => void;
	seek: (position: number) => void;
};

const RadioOuterContext = createContext<RadioOuterState | null>(null);
/**
 * The implementation layer of the RP_FM API.
 * To minimize the hassle of dealing with the inherent complexities in managing audio, I have decided to bake the tracks into the params.
 * Now this will be hydrated only when we have more than **2 tracks** available in our playlist.
 * @todo this will inevitably introduce headaches.
 */
const RadioOuterProvider = ({children}: { children: ReactNode }) => {
	const storeRef = useContext(InternalRadioContext);
	const defaultHowlOptions = useMemo(
		() => ({
			html5: true,
			preload: true,
			pool: 25,
			loop: false,
			volume: 1.0,
			autoplay: false,
			format: ["ogg"]
		}),
		[]
	);

	// const tracks = useRadioStore((t) => t.tracks);
	const setPlaying = useRadioStore((t) => t.setPlaying);
	const playing = useRadioStore(useShallow((t) => t.playing));
	const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));
	const setCurrentTrack = useRadioStore((t) => t.setCurrentTrack);
	const toggle = useRadioStore((t) => t.toggle);
	const setPaused = useRadioStore((t) => t.setPaused);
	const setTrackTime = useRadioStore((t) => t.setTrackTime);
	const cleanTrack = useRadioStore((t) => t.cleanTrack);
	const setHasRadio = useRadioStore((t) => t.setHasRadio);
	const hasRadio = useRadioStore(useShallow((t) => t.hasRadio));
	const [refreshing, setRefreshing] = useState(false);
	const tra = useRadioStore((t) => t.tracks);
	const tracks = useMemo(() => tra, [tra]);
	const setTrackStatus = useRadioStore((t) => t.setTrackStatus);
	const trackStatus = useRadioStore(useShallow((t) => t.trackStatus));
	const storeSetPlaybackRate = useRadioStore((t) => t.setPlaybackRate);
	const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));

	const setPlaybackRate = useCallback(
		(rate: number) => {
			storeSetPlaybackRate(rate);
			if (current.current?.h) {
				current.current.h.rate(rate);
			}
		},
		[storeSetPlaybackRate]
	);

	const seek = useCallback(
		(position: number) => {
			if (current.current?.h) {
				current.current.h.seek(position);
			}
		},
		[]
	);

	// Sync playback rate to Howler when it changes externally
	useEffect(() => {
		if (current.current?.h) {
			current.current.h.rate(playbackRate);
		}
	}, [playbackRate]);

	const setPlay = useCallback(
		() => setTrackStatus("playing"),
		[setTrackStatus]
	);
	const setPause = useCallback(
		() => setTrackStatus("paused"),
		[setTrackStatus]
	);
	const setEnd = useCallback(() => setTrackStatus("ended"), [setTrackStatus]);
	const setLoad = useCallback(
		() => setTrackStatus("loading"),
		[setTrackStatus]
	);
	const setError = useCallback(() => setTrackStatus("error"), [setTrackStatus]);
	const observeTrackStatus = useCallback(
		(h: Howl) => {
			h.on("play", setPlay);
			h.on("pause", setPause);
			h.on("end", setEnd);

			setTrackStatus(h.playing() ? "playing" : "paused");
			return () => {
				h.off("play", setPlay);
				h.off("pause", setPause);
				h.off("end", setEnd);
			};
		},
		[setPlay, setPause, setEnd, setTrackStatus]
	);
	const unobserver = useRef<(() => void) | null>(null);

	const current = useRef<TrackRP>(null!);
	const next = useRef<TrackRP>(null!);
	const nextIndex = useRef<number>(currentIndex + 1);
	const tracker = useRef<[TrackRP, TrackRP] | null>(null);

	useEffect(() => {
		if (!hasRadio || tracker.current) {
			return;
		}
		const h1 = tracks[currentIndex];
		const h2 = tracks[(currentIndex + 1) % tracks.length];
		if (!h1 || !h2) {
			return;
		}
		const howl1 = {
			trackIndex: currentIndex,
			uuid: nanoid(),
			h: new Howl({
				src: [h1.url],
				...defaultHowlOptions,
				onplay: () => {
					howl1.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS);
				},
				onend: () => {
					howl1.h.unload();
				}
			})
		};
		const howl2 = {
			trackIndex: (currentIndex + 1) % tracks.length,
			uuid: nanoid(),
			h: new Howl({
				src: [h2.url],
				...defaultHowlOptions,
				onplay: () => {
					howl2.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS);
				},
				onend: () => {
					howl2.h.unload();
				}
			})
		};
		tracker.current = [howl1, howl2];
		current.current = howl1;
		next.current = howl2;
		unobserver.current = observeTrackStatus(howl1.h);
	}, [currentIndex, defaultHowlOptions, hasRadio, observeTrackStatus, tracks]);

	const threshold = DEFAULT_THRESHOLD_SECONDS;
	/**
	 * Unintentionally created a pretty nice structure akin to pointers in C
	 *
	 * The flow of {@link phasedCallback} is circular:
	 * PLAY-FADE_OUT-SWITCH-FADE_IN-PLAY
	 *
	 *
	 *
	 * **/
	const FADE_OUT = "fadeOut" as const;
	const SWITCH = "switch" as const;
	const FADE_IN = "fadeIn" as const;
	const PLAY = "play" as const;
	const phase = useRef<
		typeof FADE_OUT | typeof SWITCH | typeof FADE_IN | typeof PLAY
	>(PLAY);
	const timoutID = useRef<ReturnType<typeof setTimeout> | null>(null);
	const animationFrameID = useRef<ReturnType<
		typeof requestAnimationFrame
	> | null>(null);
	const clearTimout = useCallback(() => {
		if (timoutID.current) {
			clearTimeout(timoutID.current);
			timoutID.current = null;
		}
	}, []);
	const switcher = useCallback(() => {
	}, []);

	/**
	 * Skip to a specific track by index.
	 * Unlike setCurrentTrack (which only updates the store), this actually
	 * switches the Howler audio source to the new track.
	 */
	const skipToTrack = useCallback(
		(requestedIndex: number) => {
			if (!tracker.current || !current.current?.h) return;
			if (tracks.length === 0) return;

			// Clear any pending timeouts
			if (timoutID.current) {
				clearTimeout(timoutID.current);
				timoutID.current = null;
			}

			const wasPlaying = playing;

			// Stop current audio
			if (current.current.h.playing()) {
				current.current.h.stop();
			}

			// Update store index (handles wrap-around, shuffle, reverse)
			setCurrentTrack(requestedIndex);

			// Get the resolved track from the store after update
			const resolvedState = storeRef?.getState();
			const resolvedIndex = resolvedState?.currentIndex ?? 0;
			const newTrack = tracks[resolvedIndex];
			if (!newTrack || !newTrack.url) return;

			// Reset phase
			phase.current = PLAY;

			// Clean track times for the new track
			cleanTrack();

			// Switch the Howler source
			current.current.h.switchTrack({
				src: [newTrack.url],
				...defaultHowlOptions,
			});
			current.current.trackIndex = resolvedIndex;

			// Re-observe track status
			if (unobserver.current) {
				unobserver.current();
				unobserver.current = null;
			}
			unobserver.current = observeTrackStatus(current.current.h);

			// If was playing, start playing the new track
			if (wasPlaying) {
				current.current.h.once("load", () => {
					if (current.current?.h) {
						current.current.h.play();
					}
				});
			}
		},
		[tracks, playing, setCurrentTrack, storeRef, cleanTrack, defaultHowlOptions, observeTrackStatus]
	);

	useEffect(() => {
		if (!tracker.current) {
			if (unobserver.current) {
				unobserver.current();
				unobserver.current = null;
			}
			return;
		}
		if (!current.current.h) {
			if (unobserver.current) {
				unobserver.current();
				unobserver.current = null;
			}
			return;
		}

		const phasedCallback = () => {
			if (!tracker.current) {
				clearTimout();
				animationFrameID.current &&
				cancelAnimationFrame(animationFrameID.current);
				animationFrameID.current = null;
				return;
			}
			const duration = current.current.h.duration();
			if (!duration) {
				//duration is undefined if Howler is loading
				setTrackStatus("loading");
				animationFrameID.current = requestAnimationFrame(phasedCallback);
				return;
			}
			const elapsed = current.current.h.seek();
			const remaining = duration - elapsed;
			setTrackTime(elapsed, duration);

			if (phase.current === SWITCH) {
				clearTimout();
				phase.current = FADE_IN;

				const nextIndex = (current.current.trackIndex + 1) % tracks.length;
				const nextTrack = tracks[nextIndex];
				if (!nextTrack || !nextTrack.url) return;

				next.current.h.switchTrack({
					src: [nextTrack.url],
					...defaultHowlOptions,
					onplay: () => {
						next.current.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS);
					},
					onend: () => {
						next.current.h.unload();
					}
				});
				next.current.trackIndex = nextIndex;
			} else if (phase.current === FADE_IN) {
				phase.current = PLAY;
				clearTimout();
			} else {
				if (remaining < threshold) {
					if (phase.current === PLAY) {
						phase.current = FADE_OUT;
						current.current.h.fade(1.0, 0.2, DEFAULT_TRANSITION_DURATION_MS);
						current.current.h.once("fade", () => {
							current.current.h.stop();
						});
						animationFrameID.current = requestAnimationFrame(phasedCallback);
						return;
					} else if (phase.current === FADE_OUT) {
						//this is where critical operations take place

						if (!timoutID.current) {
							//ensure that timeOut is set only once per cycle
							timoutID.current = setTimeout(() => {
								phase.current = SWITCH;
								clearTimout();
								const toLetGo = current.current;
								unobserver.current && unobserver.current();
								unobserver.current = null;
								current.current = next.current;
								next.current = toLetGo;
								if (next.current.h.playing()) {
									next.current.h.once("fade", () => {
										next.current.h.stop();
										next.current.h.unload();
										setCurrentTrack(current.current.trackIndex);
										unobserver.current = observeTrackStatus(current.current.h);
									});
									next.current.h.fade(1.0, 0.2, DEFAULT_FADE_DURATION_MS);
								} else {
									next.current.h.stop();
									next.current.h.unload();
									setCurrentTrack(current.current.trackIndex);
									unobserver.current = observeTrackStatus(current.current.h);
								}

								const dependsOnPlaying = () => {
									if (playing) {
										if (current.current.h.playing()) {
											return;
										}
										current.current.h.play();
									} else {
										if (!current.current.h) return;
										if (current.current.h.playing()) {
											current.current.h.once("fade", () => {
												current.current.h.pause();
											});
											current.current.h.fade(
												1.0,
												0.2,
												DEFAULT_FADE_DURATION_MS
											);
										}
									}
								};

								dependsOnPlaying();
								animationFrameID.current =
									requestAnimationFrame(phasedCallback);

								return;
							}, DEFAULT_TRANSITION_DURATION_MS);
						}
						return;
					}
				}
			}
			animationFrameID.current = requestAnimationFrame(phasedCallback);
		};

		if (playing) {
			current.current.h.play();
			phasedCallback();
		} else {
			// Capture the current time before pausing so the counter holds its value
			if (current.current?.h) {

				const elapsed = current.current.h.seek();
				setTrackTime(elapsed,);
			}

			if (current.current.h.playing()) {
				current.current.h.once("fade", () => {
					current.current.h.pause();
				});
				current.current.h.fade(1.0, 0.2, DEFAULT_FADE_DURATION_MS);
			} else {
				current.current.h.pause();
			}

			clearTimout();
			animationFrameID.current &&
			cancelAnimationFrame(animationFrameID.current);
			animationFrameID.current = null;
		}
	}, [
		clearTimout,
		defaultHowlOptions,
		observeTrackStatus,
		playing,
		setCurrentTrack,
		setTrackStatus,
		setTrackTime,
		threshold,
		tracks
	]);
	useEffect(() => {
		if (navigator && navigator.mediaSession) {
			navigator.mediaSession.setActionHandler("play", setPlaying);
			navigator.mediaSession.setActionHandler("pause", setPaused);
		}
	}, [setPaused, setPlaying]);

	return (
		<RadioOuterContext.Provider
			value={{
				setPlaying,
				setPaused,
				playing,
				setCurrentTrack,
				skipToTrack,
				toggle,
				currentTrackPlayer: current.current,
				setPlaybackRate,
				seek,
			}}
		>
			{children}
		</RadioOuterContext.Provider>
	);
};
export const useRadio = () => {
	const outerCtx = useContext(RadioOuterContext)!;
	if (!outerCtx)
		throw new Error("useRadio must be used inside RadioOuterProvider");
	return outerCtx;
};
export const RadioProvider = ({children}: { children: ReactNode }) => {
	return <RadioInternal>{children}</RadioInternal>;
};
