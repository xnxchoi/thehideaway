import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import { randomNumber } from "@/utilities/randomNumber";
import { clamp } from "../../utilities/mathUtilities";

export interface RP_Track {
  title: string;
  url: string;
  album: string;
  artist: string;
  id: string;
}

export type PlayMode = "default" | "reverse" | "shuffle";

export const PAUSE_DURATION = 1000;
export const AUTOPLAYED_KEY = "rp_autoplayed";
export const LAST_TRACK_KEY = "rp_last_track";
export const LAST_TIME_KEY = "rp_last_time";

const radioInit: RadioStoreState = {
  tracks: [],
  currentIndex: 0,
  nextIndex: 1,
  hasNext: false,
  crossFading: false,
  playing: false,
  trackStatus: "paused",
  elapsedTime: 0,
  remainingTime: 12220,
  hasRadio: false,
  playMode: "default",
  playbackRate: 1.0,
  seeking: false,
};

type RadioStoreState = {
  tracks: RP_Track[];
  currentIndex: number;
  nextIndex: number;
  hasNext: boolean;
  crossFading: boolean;
  playing: boolean;
  trackStatus: "playing" | "paused" | "ended" | "loading" | "error";
  elapsedTime: number;
  remainingTime: number;
  hasRadio: boolean;
  playMode: PlayMode;
  playbackRate: number;
  seeking: boolean;
};

type TrackIndicesResult = {
  currentIndex: number;
  nextIndex: number;
  hasNext: boolean;
  playMode: PlayMode;
};

/**
 * Calculates track indices based on the requested index and play mode
 * @param requestedIndex - The index requested (can be out of bounds)
 * @param tracksLength - Length of the tracks array
 * @param currentPlayMode - Current play mode
 * @returns Object with calculated currentIndex, nextIndex, hasNext, and playMode
 */
const calculateTrackIndices = (
  requestedIndex: number,
  tracksLength: number,
  currentPlayMode: PlayMode = "default"
): TrackIndicesResult => {
  // Handle empty array
  if (tracksLength === 0) {
    return {
      currentIndex: 0,
      nextIndex: 0,
      hasNext: false,
      playMode: currentPlayMode
    };
  }

  // Handle single element array
  if (tracksLength === 1) {
    return {
      currentIndex: 0,
      nextIndex: 0,
      hasNext: false,
      playMode: currentPlayMode
    };
  }

  let currentIndex: number;
  let nextIndex: number;
  let playMode = currentPlayMode;

  // Determine current index and play mode based on requested index
  if (requestedIndex >= 0 && requestedIndex < tracksLength) {
    // Within range - use default behavior
    currentIndex = requestedIndex;
    playMode = "default";
  } else if (requestedIndex < 0) {
    // Negative index - reverse play mode
    const absIndex = Math.abs(requestedIndex);
    currentIndex = clamp(
      0,
      tracksLength - (absIndex % tracksLength),
      tracksLength - 1
    );
    playMode = "reverse";
  } else {
    // Positive index exceeding range - shuffle mode
    currentIndex = randomNumber(0, tracksLength - 1);
    playMode = "shuffle";
  }

  // Calculate next index based on play mode
  switch (playMode) {
    case "reverse":
      nextIndex = currentIndex - 1;
      if (nextIndex < 0) {
        nextIndex = tracksLength - 1; // Loop to end
      }
      break;

    case "shuffle":
      // Find a random index that's not the current one
      let attempts = 0;
      do {
        nextIndex = randomNumber(0, tracksLength - 1);
        attempts++;
      } while (nextIndex === currentIndex && attempts < 10);

      // Fallback if we can't find a different index
      if (nextIndex === currentIndex) {
        nextIndex = (currentIndex + 1) % tracksLength;
      }
      break;

    case "default":
    default:
      nextIndex = currentIndex + 1;
      if (nextIndex >= tracksLength) {
        nextIndex = 0; // Loop to beginning
      }
      break;
  }

  const hasNext = tracksLength > 1;

  return {
    currentIndex,
    nextIndex,
    hasNext,
    playMode
  };
};

type RadioStoreActions = {
  setTracks: (tracks: RP_Track[]) => void;
  setCurrentTrack: (index: number) => void;
  setNextTrack: () => void;
  setPlayMode: (mode: PlayMode) => void;
  setCrossFading: (crossFading: boolean) => void;
  setTrackStatus: (
    status: "playing" | "paused" | "ended" | "loading" | "error"
  ) => void;
  setTrackTime: (elapsedTime: number, duration: number) => void;
  cleanTrack: () => void;
  setPlaying: () => void;
  setPaused: () => void;
  toggle: () => void;
  setHasRadio: (hasRadio: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setSeeking: (seeking: boolean) => void;
};

export type RadioStore = RadioStoreState & RadioStoreActions;

export const createRadioStore = (initState: RadioStoreState = radioInit) => {
  return createStore<RadioStore>()(
    subscribeWithSelector((set, get) => ({
      ...initState,

      setHasRadio: (hasRadio) => set({ hasRadio }),

      setTracks: (tracks) =>
        set((state) => {
          const trackLength = tracks.length;
          if (trackLength === 0) {
            return {
              ...state,
              tracks,
              currentIndex: 0,
              nextIndex: 0,
              hasNext: false,
              hasRadio: false,
              playMode: "default"
            };
          }

          const currentIndex = randomNumber(0, trackLength - 1);
          const { nextIndex, hasNext } = calculateTrackIndices(
            currentIndex,
            trackLength,
            "default"
          );

          return {
            ...state,
            currentIndex,
            nextIndex,
            tracks,
            hasNext,
            hasRadio: trackLength > 2,
            playMode: "default"
          };
        }),

      setCrossFading: (crossFading) => set({ crossFading }),

      setTrackStatus: (status) => set({ trackStatus: status }),

      setTrackTime: (elapsedTime: number, duration) =>
        set({ elapsedTime, remainingTime: duration - elapsedTime }),

      setCurrentTrack: (requestedIndex) =>
        set((state) => {
          const { currentIndex, nextIndex, hasNext, playMode } =
            calculateTrackIndices(
              requestedIndex,
              state.tracks.length,
              state.playMode
            );

          return {
            ...state,
            currentIndex,
            nextIndex,
            hasNext,
            hasRadio: state.tracks.length > 0,
            playMode
          };
        }),

      setNextTrack: () =>
        set((state) => {
          if (state.tracks.length === 0) return state;

          const { currentIndex, nextIndex, hasNext, playMode } =
            calculateTrackIndices(
              state.nextIndex,
              state.tracks.length,
              state.playMode
            );

          return {
            ...state,
            currentIndex,
            nextIndex,
            hasNext,
            playMode
          };
        }),

      setPlayMode: (mode) =>
        set((state) => {
          if (state.tracks.length === 0) {
            return { ...state, playMode: mode };
          }

          // Recalculate next index based on new play mode
          const { nextIndex, hasNext } = calculateTrackIndices(
            state.currentIndex,
            state.tracks.length,
            mode
          );

          return {
            ...state,
            playMode: mode,
            nextIndex,
            hasNext
          };
        }),

      setPaused: () => set({ playing: false }),

      setPlaying: () => set({ playing: true }),

      cleanTrack: () =>
        set({
          elapsedTime: 0,
          remainingTime: 0
        }),

      toggle: () => set((state) => ({ playing: !state.playing })),

      setPlaybackRate: (rate) =>
        set({ playbackRate: clamp(0.25, rate, 4.0) }),

      setSeeking: (seeking) => set({ seeking }),
    }))
  );
};
