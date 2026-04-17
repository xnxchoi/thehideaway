/* eslint-disable @typescript-eslint/no-this-alias */
"use client";

import { getRadio } from "../../../src/providers/getRadio";
import {
  DEFAULT_FADE_DURATION_MS,
  DEFAULT_THRESHOLD_SECONDS,
  DEFAULT_TRANSITION_DURATION_MS
} from "../../../src/providers/radioConstant";
import { createRadioStore, RadioStore, RP_Track } from "@/stores/Radio/Radio";
import { wait } from "../../../src/utilities/wait";
import {
  Howl,
  Howler,
  HowlListeners,
  HowlOptions,
  SoundSpriteDefinitions
} from "howler";
import { cancelFrame, frame } from "motion";
import {
  MotionValue,
  useMotionValue,
  useMotionValueEvent,
  useTransform
} from "motion/react";
import { nanoid } from "nanoid";
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState
} from "react";
import { uuidv7 } from "uuidv7";
import { useStore } from "zustand";
import { useShallow } from "zustand/shallow";

type RadioInternalAPI = ReturnType<typeof createRadioStore>;
const InternalRadioContext = createContext<RadioInternalAPI | null>(null);
//
// declare module "howler" {
//   interface Howl {
//     switchTrack: (options: HowlOptions) => void;
//     _duration: number;
//     _sprite: Record<string, [number, number]>;
//     _src: string[];
//     _format?: string | string[] | undefined;
//     _autoplay: boolean;
//     _loop: boolean;
//     _muted: boolean;
//     _volume: number;
//     _html5: boolean;
//     _sounds: Sound[];
//     _preload: boolean;
//     _rate: number;
//   }
//   interface Sound {
//     _muted: Howl["_muted"];
//     _loop: Howl["_loop"];
//     _volume: Howl["_volume"];
//     _rate: Howl["_rate"];
//     _id: number;
//     _node?: GainNode | AudioNode;
//     _parent: Howl;
//     _loadFn?: HowlListeners["onload"];
//     _loadListener: () => void;
//     _errorListener: () => void;
//     _errorFn?: HowlListeners["onloaderror"];
//     _endListener: () => void;
//
//     _seek: number;
//     _paused: boolean;
//     _ended: boolean;
//     _sprite: "__default" | SoundSpriteDefinitions;
//     create: () => Sound;
//     reset: () => Sound;
//     init: () => Sound;
//   }
// }
// Howl.prototype.switchTrack = function (o) {
//   const self = this;
//   self.unload();
//
//   self._duration = 0; // init duration
//   self._sprite = {}; // init sprite
//   self._src = typeof o.src !== "string" ? o.src : [o.src];
//   self._format = o.format;
//   self._autoplay = false;
//
//   self._loop = false;
//   self._html5 = true;
//
//   self._preload = true;
//   self.load(); // => update duration, sprite(var timeout)
// };
// Howler.autoUnlock = false;
export const useRadioStore = <T,>(selector: (store: RadioStore) => T) => {
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

const RadioInternal = ({ children }: { children: ReactNode }) => {
  const ref = useRef<RadioInternalAPI>(null);

  const getTracks = useCallback(
    async ({
      title,
      extension = "ogg"
    }: {
      title: string;
      extension?: "ogg" | "mp3";
    }) => {
      const track = await fetch(`public/track_media/${title}.${extension}`, {
        headers: {
          "Content-Type": `audio/${extension}`
        }
      });
    },
    []
  );
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
  const [hasRadio, setHasRadio] = useState(false);
  const initializeRadio = useEffectEvent(() => {
    !ref.current &&
      getRadio(tracks)
        .then((trackes) => {
          ref.current = createRadioStore({
            tracks: trackes,
            currentIndex: 0,
            crossFading: false,
            playing: false,
            trackStatus: "idle",
            elapsedTime: 0,
            remainingTime: trackes[0].duration,
            hasRadio: trackes.length > 2,
            playMode: "default",
            hasNext: trackes.length > 1,
            nextIndex: Math.min(1, trackes.length - 1),
            playbackRate: 1.0,
            seeking: false
          });
        })
        .then(() => {
          setHasRadio(true);
        });
  });

  useEffect(() => {
    !hasRadio && initializeRadio();
  }, [hasRadio]);

  return (
    <InternalRadioContext.Provider value={ref.current}>
      {hasRadio && <RadioOuterProvider>{children}</RadioOuterProvider>}
    </InternalRadioContext.Provider>
  );
};

type RadioOuterState = {
  audioLevel: MotionValue<number>;
  setPlaying: () => void;
  setPlayingBtnHover: (hovered: boolean) => void;
  setPaused: () => void;
  currentTrackPlayer: Howl | null;
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
const RadioOuterProvider = ({ children }: { children: ReactNode }) => {
  const storeRef = useContext(InternalRadioContext);
  const defaultHowlOptions = useMemo(
    () => ({
      html5: false,
      preload: true,
      pool: 25,
      loop: false,
      volume: 1.0,
      autoplay: false,
      format: ["ogg"]
    }),
    []
  );
  const audioLevel = useMotionValue(0);
  const frequencyData = useRef<Uint8Array>(new Uint8Array());
  const hover = useMotionValue(false);
  const setPlayingBtnHover = useCallback(
    (hovered: boolean) => {
      hover.set(hovered);
    },
    [hover]
  );
  const analyserRef = useRef<AnalyserNode | null>(null);
  const playing = useRadioStore(useShallow((t) => t.playing));
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  const tick = useCallback(() => {
    if (!analyserRef.current || !playingRef.current) {
      console.log(!analyserRef.current ? "no analyser" : "Not playing");
      audioLevel.set(0);
      cancelFrame(tick);
      return;
    }
    const data = frequencyData.current as Uint8Array<ArrayBuffer>;
    analyserRef.current.getByteFrequencyData(data);
    // Compute normalized average energy
    let sum = 0;
    for (let i = 3; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / (data.length * 255);
    audioLevel.set(avg);
  }, [audioLevel]);
  // const tracks = useRadioStore((t) => t.tracks);
  const setPlaying = useRadioStore((t) => t.setPlaying);
  const currentIndex = useRadioStore(useShallow((t) => t.currentIndex));
  const trackStatus = useRadioStore(useShallow((t) => t.trackStatus));
  const setPaused = useRadioStore((t) => t.setPaused);
  const setCurrentTrack = useRadioStore((t) => t.setCurrentTrack);
  const playState = useRef(trackStatus);
  useEffect(() => {
    playState.current = trackStatus;
  }, [trackStatus]);
  const toggle = useCallback(() => {
    if (playState.current === "playing") {
      setPaused();
    } else {
      setPlaying();
    }
  }, [setPaused, setPlaying]);
  const setTrackTime = useRadioStore((t) => t.setTrackTime);
  const cleanTrack = useRadioStore((t) => t.cleanTrack);
  const setHasRadio = useRadioStore((t) => t.setHasRadio);
  const hasRadio = useRadioStore(useShallow((t) => t.hasRadio));
  const [refreshing, setRefreshing] = useState(false);
  const tra = useRadioStore((t) => t.tracks);
  const tracks = useMemo(() => tra, [tra]);
  const setTrackStatus = useRadioStore((t) => t.setTrackStatus);
  const storeSetPlaybackRate = useRadioStore((t) => t.setPlaybackRate);
  const playbackRate = useRadioStore(useShallow((t) => t.playbackRate));
  const playFX = useRef<Howl>(null!),
    pauseFx = useRef<Howl>(null!),
    playingFx = useRef<Howl>(null!);

  const setPlaybackRate = useCallback(
    (rate: number) => {
      storeSetPlaybackRate(rate);
      if (current.current?.h) {
        current.current.h.rate(rate);
      }
    },
    [storeSetPlaybackRate]
  );

  const seek = useCallback((position: number) => {
    if (current.current?.h) {
      current.current.h.seek(position);
    }
  }, []);

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
  const setStop = useCallback(() => {
    setTrackStatus("stopped");
  }, [setTrackStatus]);
  const setPause = useCallback(
    () => setTrackStatus("paused"),
    [setTrackStatus]
  );
  const setEnd = useCallback(() => setTrackStatus("ended"), [setTrackStatus]);
  const setSeeking = useCallback(
    () => setTrackStatus("seeking"),
    [setTrackStatus]
  );
  const setLoad = useCallback(() => setTrackStatus("idle"), [setTrackStatus]);
  const setError = useCallback(() => setTrackStatus("error"), [setTrackStatus]);
  const to = useRef<ReturnType<typeof setTimeout> | null>(null);
  useMotionValueEvent(hover, "change", (hovered) => {
    to.current && clearTimeout(to.current);
    to.current = null;
    const pr = hover.getPrevious();
    if (typeof pr === "boolean" && pr === hovered) return;
    playState.current === "playing" &&
      playingFx.current &&
      playingFx.current.playing() &&
      (to.current = setTimeout(() => {
        playingFx.current.fade(hovered ? 0.1 : 0.2, hovered ? 0.2 : 0.1, 0.2);
      }, 50));
  });
  const onplay = useCallback(() => {
    playingFx.current.seek(0);
    playFX.current.seek(0);
    playingFx.current.volume(0.1);
    playingFx.current.once("play", () => {
      playingFx.current.once("fade", () => {
        wait(50).then(() => playingFx.current.fade(0.2, 0.1, 0.5));
      });
      playingFx.current.fade(0.1, 0.2, 0.5);
    });
    playFX.current.play();
    playingFx.current.play();
    setPlay();

    frame.update(tick, true);
  }, [setPlay, tick]);
  const onpause = useCallback(() => {
    playFX.current.pause();
    pauseFx.current.seek(0);
    pauseFx.current.volume(0.1);
    playingFx.current.pause();
    pauseFx.current.once("play", () => {});
    pauseFx.current.play();
    setPause();
    cancelFrame(tick);
  }, [setPause, tick]);

  const observeTrackStatus = useCallback(
    (h: Howl) => {
      const onload = () => {
        setLoad();
        cancelFrame(tick);
        audioLevel.set(0);
        analyserRef.current &&
          (frequencyData.current = new Uint8Array(
            analyserRef.current.frequencyBinCount
          ));
      };
      if (playingRef.current) {
        setPlay();
      }
      const onstop = () => {
        setStop();
        cancelFrame(tick);
      };
      h.on("play", onplay);
      h.on("pause", onpause);
      h.on("end", setEnd);
      h.on("stop", onstop);
      h.on("seek", setSeeking);
      h.on("load", onload);

      return () => {
        h.off("play", onplay);
        h.off("pause", onpause);
        h.off("end", setEnd);
        h.off("stop", onstop);
        h.off("seek", setSeeking);
        h.off("load", onload);
      };
    },
    [setPlay, setPause, setEnd, setStop, setSeeking, setLoad, setTrackStatus]
  );
  const unobserver = useRef<(() => void) | null>(null);

  const current = useRef<TrackRP>(null!);
  const next = useRef<TrackRP>(null!);
  const currentIndexValue = useMotionValue(currentIndex);
  useEffect(() => {
    currentIndexValue.set(currentIndex);
  }, [currentIndex, currentIndexValue]);
  const tracksCount = useMotionValue(tracks.length);
  useEffect(() => {
    tracksCount.set(tracks.length);
  }, [tracks, tracksCount]);
  const nextIndexValue = useTransform(() =>
    tracksCount.get() > 0
      ? (currentIndexValue.get() + 1) % tracksCount.get()
      : 0
  );
  const tracker = useRef<[string, string] | null>(null);
  const initializer = useEffectEvent(
    ({
      h1,
      h2,
      cc,
      nc
    }: {
      h1: RP_Track;
      h2: RP_Track;
      cc: number;
      nc: number;
    }) => {
      const howl1 = {
        trackIndex: cc,
        uuid: nanoid(),
        h: new Howl({
          src: [h1.url],
          ...defaultHowlOptions,
          onplay: () => {
            howl1.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS);
          }
        })
      };

      const howl2 = {
        trackIndex: nc,
        uuid: nanoid(),
        h: new Howl({
          src: [h2.url],
          ...defaultHowlOptions,
          onplay: () => {
            howl2.h.fade(0.0, 1.0, DEFAULT_FADE_DURATION_MS);
          }
        })
      };
      current.current = howl1;

      next.current = howl2;

      tracker.current = [howl1.uuid, howl2.uuid];
      unobserver.current = observeTrackStatus(howl1.h);
    }
  );
  useEffect(() => {
    if (!hasRadio || tracker.current) {
      return;
    }
    const cc = currentIndexValue.get(),
      nc = nextIndexValue.get();
    const h1 = tracks[cc];
    const h2 = tracks[nc];
    if (!h1 || !h2) {
      return;
    }
    initializer({ fgTrack: h1, bgTrack: h2, fgTrackIdx: cc, bgTrackIdx: nc });
  }, [currentIndexValue, hasRadio, nextIndexValue, tracks]);

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

  /**
   * Skip to a specific track by index.
   * Unlike setCurrentTrack (which only updates the store), this actually
   * switches the Howler audio source to the new track.
   */
  const skipToTrack = useCallback(
    (requestedIndex: number) => {
      if (!tracker.current || !fgHowl.current) return;
      if (tracks.length === 0) return;

      // Clear any pending timeouts
      if (timoutID.current) {
        clearTimeout(timoutID.current);
        timoutID.current = null;
      }

      const wasPlaying = playing;

      // Stop current audio
      if (fgHowl.current.playing()) {
        fgHowl.current.stop();
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
        ...defaultHowlOptions
      });
      current.current.trackIndex = resolvedIndex;

      // Re-observe track status
      if (unobserver.current) {
        unobserver.current();
        unobserver.current = null;
      }
      unobserver.current = observeTrackStatus(fgHowl.current);

      // If was playing, start playing the new track
      if (wasPlaying) {
        current.current.h.once("load", () => {
          if (current.current?.h) {
            current.current.h.play();
          }
        });
      }
    },
    [
      tracks,
      playing,
      setCurrentTrack,
      storeRef,
      cleanTrack,
      defaultHowlOptions,
      observeTrackStatus
    ]
  );

  useEffect(() => {
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
        setTrackTime(elapsed);
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
    <RadioOuterContext
      value={{
        setPlaying,
        setPaused,
        setPlayingBtnHover,
        playing,
        setCurrentTrack,
        audioLevel,
        skipToTrack,
        toggle,
        currentTrackPlayer: current.current,
        setPlaybackRate,
        seek
      }}
    >
      {children}
    </RadioOuterContext>
  );
};
export const useRadio = () => {
  const outerCtx = useContext(RadioOuterContext)!;
  if (!outerCtx)
    throw new Error("useRadio must be used inside RadioOuterProvider");
  return outerCtx;
};
export const RadioProvider = ({ children }: { children: ReactNode }) => {
  return <RadioInternal>{children}</RadioInternal>;
};
