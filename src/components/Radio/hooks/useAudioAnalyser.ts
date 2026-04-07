"use client";

import { MotionValue, useMotionValue } from "motion/react";
import { useCallback, useEffect, useRef } from "react";
import { Howler } from "howler";
import { useRadio, useRadioStore } from "@/providers/RadioProvider";
import { useShallow } from "zustand/shallow";

type AudioAnalyserOptions = {
  fftSize?: number;
  smoothing?: number;
};

type AudioAnalyserReturn = {
  audioLevel: MotionValue<number>;
  frequencyData: React.RefObject<Uint8Array>;
  isAnalysing: boolean;
};

/**
 * Bridges Howler.js HTML5 audio to a Web Audio AnalyserNode for real-time
 * frequency data. Writes a normalized average energy level (0-1) to a
 * MotionValue on each animation frame — no React re-renders.
 */

// Track which audio elements already have a MediaElementSource
const connectedElements = new WeakSet<HTMLMediaElement>();

export function useAudioAnalyser({
  fftSize = 256,
  smoothing = 0.85
}: AudioAnalyserOptions = {}): AudioAnalyserReturn {
  const audioLevel = useMotionValue(0);
  const frequencyData = useRef<Uint8Array>(new Uint8Array(fftSize / 2));
  const isAnalysingRef = useRef(false);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const { currentTrackPlayer } = useRadio();
  const playing = useRadioStore(useShallow((s) => s.playing));

  const tick = useCallback(() => {
    if (!analyserRef.current) {
      audioLevel.set(0);
      return;
    }

    const data = frequencyData.current;
    analyserRef.current.getByteFrequencyData(data);

    // Compute normalized average energy
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / (data.length * 255);
    audioLevel.set(avg);

    rafRef.current = requestAnimationFrame(tick);
  }, [audioLevel, frequencyData]);

  // Connect AnalyserNode to Howler's audio pipeline
  useEffect(() => {
    const howl = currentTrackPlayer?.h;
    if (!howl || !playing) {
      // Stop analysis when not playing
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      isAnalysingRef.current = false;
      audioLevel.set(0);
      return;
    }

    // Howler.ctx may not exist until first user interaction triggers audio
    const ctx = Howler.ctx;
    if (!ctx) return;

    // Access the underlying HTML5 audio element
    const sounds = (howl as any)._sounds;
    if (!sounds || sounds.length === 0) return;
    const audioNode = sounds[0]._node as HTMLMediaElement | undefined;
    if (!audioNode) return;

    // Create analyser if needed
    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
      frequencyData.current = new Uint8Array(
        analyserRef.current.frequencyBinCount
      );
    }

    // Connect MediaElementSource -> Analyser -> masterGain
    // A given HTMLMediaElement can only be connected once
    if (!connectedElements.has(audioNode)) {
      try {
        const source = ctx.createMediaElementSource(audioNode);
        source.connect(analyserRef.current);
        analyserRef.current.connect(Howler.masterGain);
        sourceRef.current = source;
        connectedElements.add(audioNode);
      } catch {
        // Element may already be connected (e.g., hot reload)
        // Fallback: just reconnect analyser to masterGain
        try {
          analyserRef.current.connect(Howler.masterGain);
        } catch {
          // Already connected
        }
      }
    }

    // Start analysis loop
    isAnalysingRef.current = true;
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      isAnalysingRef.current = false;
    };
  }, [
    currentTrackPlayer,
    playing,
    fftSize,
    smoothing,
    tick,
    audioLevel,
    frequencyData
  ]);

  return {
    audioLevel,
    frequencyData,
    isAnalysing: isAnalysingRef.current
  };
}
