import {createStore} from "zustand/vanilla"
import {subscribeWithSelector} from "zustand/middleware"
import {randomNumber} from "@/utilities/randomNumber"

export interface RP_Track {
	title: string
	url: string
	album: string
	artist: string
	id: string
}

export const PAUSE_DURATION = 1000
export const AUTOPLAYED_KEY = "rp_autoplayed"
export const LAST_TRACK_KEY = "rp_last_track"
export const LAST_TIME_KEY = "rp_last_time"

const radioInit: RadioStoreState = {
	tracks: [],
	trackLength: 0,
	currentIndex: 0,
	currentTrack: null!,
	crossFading: false,
	playing: false,
	trackStatus: "paused",
	elapsedTime: 0,
	remainingTime: 12220,
	hasRadio: false,
	currentTrackInfo: {
		title: "",
		artist: "",
		album: "",
	},
}

type RadioStoreState = {
	tracks: RP_Track[]
	trackLength: number
	currentIndex: number
	currentTrack: RP_Track
	crossFading: boolean
	playing: boolean
	trackStatus: "playing" | "paused" | "ended" | "loading" | "error"
	elapsedTime: number
	remainingTime: number
	hasRadio: boolean
	currentTrackInfo: {
		title: string
		artist: string
		album: string

	}
}

type RadioStoreActions = {
	setTracks: (tracks: RP_Track[]) => void
	setCurrentTrack: (index: number) => void
	setCrossFading: (crossFading: boolean) => void
	setTrackStatus: (
		status: "playing" | "paused" | "ended" | "loading" | "error",
	) => void
	setTrackTime: (elapsedTime: number, duration: number) => void
	cleanTrack: () => void

	setPlaying: () => void
	setPaused: () => void
	toggle: () => void
	setHasRadio: (hasRadio: boolean) => void
}
export type RadioStore = RadioStoreState & RadioStoreActions
export const createRadioStore = (initState: RadioStoreState = radioInit) => {
	return createStore<RadioStore>()(
		subscribeWithSelector((set) => ({
			...initState,

			setHasRadio: (hasRadio) => set({hasRadio}),
			setTracks: (tracks) =>
				set((state) => {
					const trackLength = tracks.length
					const currentIndex = randomNumber(0, trackLength - 1)
					const currentTrack = tracks[currentIndex]
					return {
						...state,
						currentIndex,
						trackLength,
						currentTrack,
						tracks,
						hasRadio: trackLength > 2,
					}
				}),
			setCrossFading: (crossFading) => set({crossFading}),
			setTrackStatus: (status) => set({trackStatus: status}),
			setTrackTime: (elapsedTime: number, duration) =>
				set({elapsedTime, remainingTime: duration - elapsedTime}),
			setCurrentTrack: (index) =>
				set((state) => {
					const stacks = state.tracks.length
					if (stacks < 1) {
						return {
							...state,
							trackLength: stacks,
							currentIndex: 0,
							currentTrack: null!,
							currentTrackInfo: {
								title: "",
								artist: "",
								album: "",
							},
						}
					}
					let trueIndex = index
					if (trueIndex < 0) {
						const absIndex = Math.abs(trueIndex)
						trueIndex = stacks - (absIndex % stacks)
					} else if (trueIndex > stacks - 1) {
						trueIndex = index % stacks
					}
					//most definitely will be a defined RP_Track.. but we could always be vigilant
					const track = state.tracks[trueIndex]
					if (track) {
						return {
							...state,
							trackLength: stacks,
							currentTrack: track,
							currentIndex: trueIndex,
							currentTrackInfo: {
								title: track.title,
								artist: track.artist,
								album: track.album,
							},
						}
					}
					return {...state, trackLength: stacks}
				}),
			setPaused: () => set({playing: false}),
			setPlaying: () => set({playing: true}),
			cleanTrack: () =>
				set({
					elapsedTime: 11210,
					remainingTime: 11210,
				}),
			toggle: () => set((state) => ({playing: !state.playing})),
		})),
	)
}

// export type RP_Playlist = Pick<Playlist, "id" | "title"> & {
//   tracks: RP_Track[]
// };
// export type PlayDirection = "next" | "prev"
// export type HA_RA = {
//   playing: boolean;
//   autoPlayed: boolean;
//   lastVolume: number;
//   lastIndex: number;
//   lastTime: number;
// }

// export type RADIO_RP = {
//   currentIndex: number;

//   play: (index?: number) => void
//     | Promise<void>;
//   pause: () => void;
//   skipTo: (index: number) => void
//   skip: (direction?: PlayDirection) => void
//   volume: (vol: number) => void
//   seek: (percentage: number) => void
//   step: () => void
//   playlist: RP_Playlist;
// }

// export type HA_RA_ACT = {
//   setAutoPlayed: (l: boolean) => void;
//   setPlaylist: (p: RP_Playlist) => void;
//   togglePlay: () => void;
//   hydrateFromCookies: () => void;
//   persistToCookies: () => void;
// };

// export interface RP_FM extends HA_RA, HA_RA_ACT, RADIO_RP {

// }

// const radioInitSt: HA_RA = {
//   lastVolume: 0.5,
//   lastIndex: 0,
//   lastTime: 0,
//   playing: false,
//   autoPlayed: false,
// };

// export const createRadioStore = (initial = radioInitSt) =>
//   createStore<RP_FM>()(
//     subscribeWithSelector((set, get) => ({
//       ...initial,
//       currentIndex: 0,

//       playlist: {
//         id: 0,
//         title: "",
//         tracks: [],
//       },
//       togglePlay: () => set((s) => ({ ...s, playing: !s.playing })),
//       setAutoPlayed: (l) => set(() => ({ autoPlayed: l })),
//       setPlaylist: (p) => set((s) => ({ ...s, playlist: { ...s.playlist, ...p, tracks: p.tracks.flatMap(t => ({ ...t, howl: null, duration: null })) } })),
//       setCurrentIndex: (i) => set(() => ({ currentIndex: i })),
//       setLastIndex: (i) => set(() => ({ lastIndex: i })),
//       setPlaying: (b) => set(() => ({ playing: b })),
//       setLastTime: (t) => set(() => ({ lastTime: t })),

//       volume: (v) => {
//         Howler.volume(v);
//         set(() => ({ lastVolume: v }));
//         localStorage.set("rp_fm_vol", String(v));
//       },
//       play: async (indexOverride) => {
//         const state = get();
//         const index = indexOverride ?? state.currentIndex;
//         const track = state.playlist.tracks[index];
//         const currentIndex = state.currentIndex;
//         if (!track) return;
//         if (!track.howl) {
//           track.howl = new Howl({
//             src: [track.url],
//             volume: state.lastVolume,
//             onseek: () => set(() => ({ lastTime: get().lastTime })),
//             html5: true,
//             preload: true,
//             onend: () => get().skip("next"),
//             onplay: () => {
//               set((s) => ({
//                 ...s,
//                 currentIndex: index,
//                 lastIndex: currentIndex,
//                 playing: true,
//               }))
//               requestAnimationFrame(get().step);
//             },
//             onpause: () => set(() => ({ playing: false })),
//             onstop: () => set(() => ({ playing: false })),

//           });
//         }
//         track.howl.play();
//       },
//       seek: (time) => {
//         const track = get().playlist.tracks?.[get().currentIndex];
//         if (track?.howl) track.howl.seek(time);
//       },
//       pause: () => {
//         const howl = get().playlist.tracks?.[get().currentIndex]?.howl;
//         if (howl?.playing()) howl.pause();
//       },

//       skipTo: async (i) => {
//         get().playlist.tracks?.[get().currentIndex]?.howl?.stop();
//         await get().play(i);
//       },
//       step: () => {
//         const { currentIndex, playlist } = get();
//         const track = playlist.tracks[currentIndex];
//         if (!track || !track.howl) return;
//         const duration = track.howl.duration();
//         const seek = track.howl.seek();
//         const progress = ((seek / duration) * 100) || 0;
//         set(() => ({ lastTime: seek, lastIndex: currentIndex, }));
//         if (track.howl?.playing()) {
//           requestAnimationFrame(get().step);
//         }
//       },
//       skip: async (dir) => {
//         const { currentIndex, playlist } = get();
//         const len = playlist.tracks?.length ?? 0;
//         let next = dir === "next" ? currentIndex + 1 : currentIndex - 1;
//         if (next < 0) next = Math.max(0, (len - 1) + next);
//         if (next >= len) next = next % len;
//         await get().skipTo(next);
//       },

//       hydrateFromCookies: () => {
//         if (typeof localStorage === "undefined") return;
//         const vol = localStorage.get("rp_fm_vol");
//         const timeRaw = localStorage.get("rp_fm_time");
//         const pref = localStorage.get("rp_fm_pref");

//         if (vol) get().volume(parseFloat(vol));
//         if (pref) {
//           const parsed = JSON.parse(pref);
//           get().setPlaylist(parsed.playlist || []);
//         }

//         if (timeRaw) {
//           const timeObj = JSON.parse(timeRaw);
//           const tracks = get().playlist.tracks;
//           const matchIdx = tracks?.findIndex((t) => t.id === timeObj.lastIndex) ?? -1;
//           const index = matchIdx !== -1 ? matchIdx : 0;
//           get().setCurrentIndex(index);
//           get().setLastTime(timeObj.lastTime); // sync index just in case
//         }
//       },

//       persistToCookies: () => {
//         const { volume, playlist, lastTime, lastIndex } = get();
//         if (typeof localStorage === "undefined") return;
//         localStorage.set("rp_fm_vol", String(volume));
//         localStorage.set("rp_fm_time", JSON.stringify({ lastTime, lastIndex }));
//         localStorage.set("rp_fm_pref", JSON.stringify({ ...playlist }));
//       },
//     })),
//   );
