"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { ImageMedia } from "@/components/core/Media/Image";
import { getMediaUrl } from "@/utilities/getMediaUrl";
import type { GuestProfile } from "./types";

type Props = {
  guest: GuestProfile | null;
  isViewer: boolean;
  onClose: () => void;
};

export function GuestFocus({ guest, isViewer, onClose }: Props) {
  const t = useTranslations("Event.Guests");
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  // Reset gallery when switching guests
  useEffect(() => {
    setActivePhotoIdx(0);
  }, [guest?.profileId]);

  // ESC to close
  useEffect(() => {
    if (!guest) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guest, onClose]);

  return (
    <AnimatePresence>
      {guest && (
        <m.div
          key={`focus-${guest.profileId}`}
          className="fixed inset-0 z-[120] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={onClose}
            aria-label={t("actions.close")}
            className="absolute inset-0 bg-background/85 backdrop-blur-md"
          />

          {/* Card */}
          <m.div
            className="relative z-[1] mx-4 grid max-h-[88vh] w-full max-w-3xl grid-rows-[auto_1fr] overflow-hidden rounded-2xl border border-border/15 bg-background/80 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl xl:max-w-4xl"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-6 border-b border-border/15 px-6 py-5 xl:px-9 xl:py-7">
              <div>
                {isViewer && (
                  <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-foreground/55 uppercase">
                    {t("you")}
                  </p>
                )}
                <h2 className="text-3xl font-light tracking-tight xl:text-4xl">
                  {guest.displayName}
                </h2>
                {guest.igHandle && (
                  <a
                    href={`https://instagram.com/${guest.igHandle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-foreground/65 uppercase transition-colors hover:text-foreground"
                  >
                    @{guest.igHandle}
                    <span aria-hidden>↗</span>
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("actions.close")}
                className="shrink-0 border border-border/30 px-3 py-1.5 font-mono text-[10px] tracking-widest text-foreground/70 uppercase transition-colors hover:border-border hover:text-foreground"
              >
                {t("actions.close")}
              </button>
            </div>

            {/* Body */}
            <div className="grid gap-6 overflow-y-auto px-6 py-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10 xl:px-9 xl:py-8">
              {/* Portrait + intro */}
              <div className="flex flex-col gap-5">
                {guest.portrait && (
                  <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={guest.portrait}
                      alt={guest.displayName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                )}
                <div>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.2em] text-foreground/55 uppercase">
                    {t("intro.label")}
                  </p>
                  <p className="text-base leading-relaxed font-light text-foreground/85">
                    {guest.intro}
                  </p>
                </div>
              </div>

              {/* Gallery */}
              <div className="flex flex-col gap-3">
                <p className="font-mono text-[10px] tracking-[0.2em] text-foreground/55 uppercase">
                  {t("gallery.label")}
                </p>
                {guest.gallery.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/25">
                    <p className="font-mono text-[11px] text-foreground/45">
                      {t("gallery.empty")}
                    </p>
                  </div>
                ) : (
                  <Gallery
                    items={guest.gallery}
                    activeIdx={activePhotoIdx}
                    onSelect={setActivePhotoIdx}
                  />
                )}
              </div>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}

type GalleryProps = {
  items: GuestProfile["gallery"];
  activeIdx: number;
  onSelect: (i: number) => void;
};

function Gallery({ items, activeIdx, onSelect }: GalleryProps) {
  const active = items[activeIdx] ?? items[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted/20">
        <ImageMedia
          src={getMediaUrl(active.media.url)}
          imgClassName="absolute inset-0 h-full w-full object-cover"
        />
      </div>
      {items.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {items.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Photo ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-md transition-opacity ${
                i === activeIdx ? "opacity-100" : "opacity-50 hover:opacity-80"
              }`}
            >
              <ImageMedia
                src={getMediaUrl(item.media.url)}
                imgClassName="absolute inset-0 h-full w-full object-cover"
              />
              {i === activeIdx && (
                <span className="pointer-events-none absolute inset-0 ring-1 ring-foreground/40 ring-inset" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
