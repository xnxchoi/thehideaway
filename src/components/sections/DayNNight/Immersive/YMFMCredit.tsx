"use client";

import { Button } from "@/components/core/Button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { AudioBars } from "./AudioBars";

export const YMFM_PLAY_EVENT = "day-n-night:ymfm-play";
export const YMFM_STATE_EVENT = "day-n-night:ymfm-state";

type YmFmStateEvent = CustomEvent<{ playing: boolean }>;

export function YMFMCredit({ className }: { className?: string }) {
  const t = useTranslations("Event.DayNNight.act.night.dj");
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const onState = (event: Event) => {
      const detail = (event as YmFmStateEvent).detail;
      setPlaying(Boolean(detail?.playing));
    };
    window.addEventListener(YMFM_STATE_EVENT, onState);
    return () => window.removeEventListener(YMFM_STATE_EVENT, onState);
  }, []);

  const handlePlay = () => {
    window.dispatchEvent(new CustomEvent(YMFM_PLAY_EVENT));
    setOpen(true);
  };

  return (
    <div
      className={cn(
        "relative grid max-w-[min(34rem,100%)] gap-4 rounded-2xl border border-[var(--dn-line)]",
        "bg-[oklch(95%_0.01_85)] px-5 py-4 text-[oklch(18%_0.012_280)]",
        "shadow-[0_18px_50px_-16px_rgba(0,0,0,0.78)] md:px-6 md:py-5",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="m-0 font-mono text-[10px] leading-[1.4] tracking-[0.28em] text-[oklch(28%_0.02_280/0.72)] uppercase">
          {t("listenTitle")}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={handlePlay}
            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-[oklch(18%_0.012_280/0.22)] px-4 font-mono text-[10px] tracking-[0.2em] uppercase transition-[background-color,color,border-color] duration-200 hover:border-[oklch(18%_0.012_280/0.7)] hover:bg-[oklch(18%_0.012_280)] hover:text-[oklch(96%_0.005_80)]"
            aria-pressed={playing}
            data-active={playing ? "true" : "false"}
          >
            <AudioBars active={playing} />
            <span>{playing ? t("playingLabel") : t("listenLabel")}</span>
          </Button>
          <Button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={t("infoLabel")}
            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-[oklch(18%_0.012_280/0.18)] font-mono text-[11px] text-[oklch(18%_0.012_280/0.65)] transition-colors hover:border-[oklch(18%_0.012_280/0.55)] hover:text-[oklch(18%_0.012_280)]"
          >
            i
          </Button>
        </div>
      </div>

      {open ? (
        <div className="grid gap-4 border-t border-[oklch(18%_0.012_280/0.14)] pt-4">
          <dl className="grid gap-2">
            <TrackMeta label={t("trackLabel")} value={t("trackTitle")} />
            <TrackMeta label={t("albumLabel")} value={t("album")} />
            <TrackMeta label={t("artistLabel")} value={t("artist")} />
          </dl>
          <p className="m-0 max-w-[42ch] font-serif text-[1.05rem] leading-[1.45] tracking-[0.005em] text-[oklch(24%_0.015_280/0.78)]">
            {t("trackNote")}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function TrackMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-3">
      <dt className="font-mono text-[9px] leading-[1.55] tracking-[0.24em] text-[oklch(18%_0.012_280/0.48)] uppercase">
        {label}
      </dt>
      <dd className="m-0 font-sans text-sm leading-[1.45] font-medium tracking-tight text-[oklch(18%_0.012_280/0.82)]">
        {value}
      </dd>
    </div>
  );
}
