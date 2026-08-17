"use client";

/**
 * Dev-only leva panel for the r3f fragrance scene — grade + perf knobs plus a
 * light localStorage variant system (save / switch / delete named looks).
 *
 * Mounted only outside production and reached through a dynamic import (see
 * fragrance-scene-r3f.tsx), so leva stays out of the shipped bundle. It writes
 * to the `useFragranceR3fTuning` store; the scene subscribes to that store.
 *
 * Persistence (all dev-only, all in this file — never touches prod):
 *  • `lost-fragrance-r3f-last`     — autosaved current dial, restored on reload.
 *  • `lost-fragrance-r3f-variants` — named snapshots. Type a name → Save; pick
 *    from the dropdown → the scene switches; Delete removes the active one.
 */

import { button, folder, Leva, useControls } from "leva";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import {
  FRAGRANCE_R3F_TUNING_DEFAULTS,
  pickTuning,
  useFragranceR3fTuning,
  type FragranceR3fTuning
} from "./fragrance-r3f-tuning";

const VARIANTS_KEY = "lost-fragrance-r3f-variants";
const LAST_KEY = "lost-fragrance-r3f-last";
const REFL_OPTIONS = [128, 256, 512, 1024];
const MSAA_OPTIONS = [0, 2, 4, 8];
const LAST_DEBOUNCE_MS = 300;

type VariantMap = Record<string, FragranceR3fTuning>;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / disabled — dev tooling, safe to ignore
  }
}

export function FragranceR3fPanel() {
  const setTuning = useFragranceR3fTuning((s) => s.setTuning);

  // `seed` is the value set leva opens on. It's a ref (not React state) so a
  // slider drag mutates it without rebuilding the panel; `version` bumps only on
  // load/reset, which is when we DO want leva to reseed to the new values.
  const seed = useRef<FragranceR3fTuning>({
    ...FRAGRANCE_R3F_TUNING_DEFAULTS,
    ...readJSON<Partial<FragranceR3fTuning>>(LAST_KEY, {})
  });
  const [version, bump] = useReducer((n: number) => n + 1, 0);
  const [variants, setVariants] = useState<VariantMap>(() =>
    readJSON<VariantMap>(VARIANTS_KEY, {})
  );
  const [active, setActive] = useState<string>("");

  // debounce the "last dial" autosave so a drag doesn't hammer localStorage
  const lastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheLast = useCallback((value: FragranceR3fTuning) => {
    if (lastTimer.current) clearTimeout(lastTimer.current);
    lastTimer.current = setTimeout(
      () => writeJSON(LAST_KEY, value),
      LAST_DEBOUNCE_MS
    );
  }, []);

  const apply = useCallback(
    (patch: Partial<FragranceR3fTuning>) => {
      Object.assign(seed.current, patch);
      setTuning(patch);
      cacheLast(seed.current);
    },
    [setTuning, cacheLast]
  );

  const names = useMemo(() => Object.keys(variants), [variants]);
  const presetOptions = names.length ? names : ["—"];

  const loadVariant = useCallback(
    (name: string) => {
      const v = variants[name];
      if (!v) return;
      setActive(name);
      seed.current = { ...v };
      setTuning(v);
      writeJSON(LAST_KEY, v);
      bump();
    },
    [variants, setTuning]
  );

  useControls(
    () => ({
      grade: folder({
        exposure: {
          value: seed.current.exp,
          min: 0.2,
          max: 2.5,
          step: 0.01,
          onChange: (v: number) => apply({ exp: v })
        },
        keyLight: {
          value: seed.current.key,
          min: 0,
          max: 3,
          step: 0.01,
          onChange: (v: number) => apply({ key: v })
        },
        bloom: {
          value: seed.current.bloom,
          min: 0,
          max: 3,
          step: 0.01,
          onChange: (v: number) => apply({ bloom: v })
        }
      }),
      performance: folder({
        dpr: {
          value: seed.current.dpr,
          min: 0.5,
          max: 2,
          step: 0.05,
          onChange: (v: number) => apply({ dpr: v })
        },
        transmission: {
          value: seed.current.trs,
          min: 0.1,
          max: 1,
          step: 0.05,
          onChange: (v: number) => apply({ trs: v })
        },
        reflection: {
          value: seed.current.refl,
          options: REFL_OPTIONS,
          onChange: (v: number) => apply({ refl: v })
        },
        msaa: {
          value: seed.current.msaa,
          options: MSAA_OPTIONS,
          onChange: (v: number) => apply({ msaa: v })
        }
      }),
      glass: folder({
        ior: {
          value: seed.current.glassIor,
          min: 1,
          max: 2.4,
          step: 0.01,
          onChange: (v: number) => apply({ glassIor: v })
        },
        roughness: {
          value: seed.current.glassRoughness,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => apply({ glassRoughness: v })
        },
        thickness: {
          value: seed.current.glassThickness,
          min: 0,
          max: 5,
          step: 0.05,
          onChange: (v: number) => apply({ glassThickness: v })
        },
        clearcoat: {
          value: seed.current.glassClearcoat,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => apply({ glassClearcoat: v })
        },
        envMap: {
          value: seed.current.glassEnvMap,
          min: 0,
          max: 5,
          step: 0.05,
          onChange: (v: number) => apply({ glassEnvMap: v })
        }
      }),
      juice: folder({
        // hex color control — drives color + specularColor + blendColor together
        hue: {
          value: seed.current.juiceHue,
          onChange: (v: string) => apply({ juiceHue: v })
        },
        roughness: {
          value: seed.current.juiceRoughness,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => apply({ juiceRoughness: v })
        },
        clearcoat: {
          value: seed.current.juiceClearcoat,
          min: 0,
          max: 1,
          step: 0.01,
          onChange: (v: number) => apply({ juiceClearcoat: v })
        },
        thickness: {
          value: seed.current.juiceThickness,
          min: 0,
          max: 5,
          step: 0.05,
          onChange: (v: number) => apply({ juiceThickness: v })
        },
        envMap: {
          value: seed.current.juiceEnvMap,
          min: 0,
          max: 5,
          step: 0.05,
          onChange: (v: number) => apply({ juiceEnvMap: v })
        }
      }),
      variants: folder({
        preset: {
          options: presetOptions,
          value: active && names.includes(active) ? active : presetOptions[0],
          onChange: (name: string) => {
            if (name !== "—") loadVariant(name);
          }
        },
        name: { value: "" },
        save: button((get) => {
          const raw = (
            (get("variants.name") as string) ||
            active ||
            "variant"
          ).trim();
          if (!raw) return;
          const snapshot = pickTuning(useFragranceR3fTuning.getState());
          setVariants((prev) => {
            const next = { ...prev, [raw]: snapshot };
            writeJSON(VARIANTS_KEY, next);
            return next;
          });
          setActive(raw);
          bump();
        }),
        delete: button(() => {
          if (!active || !variants[active]) return;
          setVariants((prev) => {
            const next = { ...prev };
            delete next[active];
            writeJSON(VARIANTS_KEY, next);
            return next;
          });
          setActive("");
          bump();
        }),
        reset: button(() => {
          seed.current = { ...FRAGRANCE_R3F_TUNING_DEFAULTS };
          setTuning(FRAGRANCE_R3F_TUNING_DEFAULTS);
          writeJSON(LAST_KEY, seed.current);
          bump();
        })
      })
    }),
    // rebuild (reseed) when a variant is loaded/reset, or the preset list changes
    [version, presetOptions.join("|"), active, apply, loadVariant]
  );

  return <Leva collapsed={false} />;
}
