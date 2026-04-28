import Link from "next/link";
import { MarkerStroke } from "@/components/UX/MarkerStroke";
import s from "./Demimonde.module.scss";

/**
 * Placeholder chapter. Sits below the hero on /demimonde while the real
 * Events collection + curation flow are built. Communicates the structure
 * the page will grow into so the link from /plans never feels empty.
 */
export function DemimondePlaceholderChapter() {
  return (
    <section className={s.chapter} aria-labelledby="placeholder-chapter">
      <div className={s.chapterHead}>
        <p className={s.chapterEyebrow}>Vol. I · Coming soon</p>
        <h2 id="placeholder-chapter" className={s.chapterTitle}>
          The first one is{" "}
          <span className={s.chapterTitleAccent}>
            already on the calendar.
            <span className={s.chapterUnderline} aria-hidden>
              <MarkerStroke
                variant="underline"
                trigger="in-view"
                color="oklch(0.85 0.13 60)"
                strokeWidth={3}
              />
            </span>
          </span>
        </h2>
      </div>

      <div className={s.chapterBody}>
        <div className={s.polaroidStack}>
          <div className={`${s.polaroid} ${s.polaroidA}`}>
            <div className={s.polaroidPaper}>
              <div className={`${s.polaroidPhoto} ${s.tonePh1}`}>
                <span className={s.polaroidStamp}>▮▮▮▮</span>
              </div>
              <div className={s.polaroidCaption}>
                <span>Hannam · 2026</span>
                <span className={s.polaroidNumber}>001</span>
              </div>
            </div>
          </div>
          <div className={`${s.polaroid} ${s.polaroidB}`}>
            <div className={s.polaroidPaper}>
              <div className={`${s.polaroidPhoto} ${s.tonePh2}`}>
                <span className={s.polaroidStamp}>▮▮▮▮▮▮</span>
              </div>
              <div className={s.polaroidCaption}>
                <span>Itaewon · undisclosed</span>
                <span className={s.polaroidNumber}>002</span>
              </div>
            </div>
          </div>
          <div className={`${s.polaroid} ${s.polaroidC}`}>
            <div className={s.polaroidPaper}>
              <div className={`${s.polaroidPhoto} ${s.tonePh3}`}>
                <span className={s.polaroidStamp}>▮▮▮</span>
              </div>
              <div className={s.polaroidCaption}>
                <span>Seongsu · members</span>
                <span className={s.polaroidNumber}>003</span>
              </div>
            </div>
          </div>
        </div>

        <aside className={s.chapterAside}>
          <p>
            When the first one happens, this page becomes its chronicle. Photos,
            fragments, half-remembered toasts.
          </p>
          <p>
            Patrons see them <strong>first</strong>. Members see them{" "}
            <strong>after</strong>. Everyone else hears about them.
          </p>
          <Link href="/plans" className={s.chapterCta} prefetch={false}>
            Find your way in
          </Link>
        </aside>
      </div>
    </section>
  );
}
