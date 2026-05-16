import s from "./Demimonde.module.scss";
import { MAP } from "./content";

/**
 * DemimondeMap — illustrated neighborhood sketch + address card.
 *
 * Athens-26 leaves location to plain text links; for a one-day in-person
 * gathering, guests benefit from a visual anchor of where the venue
 * sits relative to landmarks they know. We go illustrative rather than
 * embedded — a Google Maps iframe would clash with the editorial paper
 * surface and force a Google UI we can't restyle.
 *
 * The SVG is hand-drawn-feel: faint topographic curves, a river arc, a
 * park patch, three streets, and a bold tomato-red marker at the venue.
 * Everything resolves to the shell's design tokens via currentColor or
 * direct var() references so the sketch retones with the theme without
 * editing the file.
 *
 * The address card on the right (or below, on mobile) carries the
 * functional bits — full address, coordinates, transit metadata, and
 * "open in [external map]" CTAs.
 */
export function DemimondeMap() {
  return (
    <section className={`${s.section} ${s.map}`} aria-labelledby="map-section">
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{MAP.eyebrow}</span>
          <h2 id="map-section" className={s.sectionTitle}>
            {MAP.title}
          </h2>
          <p className={s.sectionLede}>{MAP.lede}</p>
        </header>

        <div className={s.mapBody}>
          <figure className={s.mapFigure}>
            <svg
              viewBox="0 0 600 600"
              className={s.mapSvg}
              role="img"
              aria-label="Stylized neighborhood sketch with the venue marked"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Faint topographic curves — establish the "drawn paper"
                  feel. Wavy horizontals near the top. */}
              <g className={s.mapTopo}>
                <path d="M -20 110 Q 150 80 320 110 T 620 105" />
                <path d="M -20 150 Q 150 125 320 150 T 620 145" />
                <path d="M -20 190 Q 150 170 320 195 T 620 185" />
                <path d="M -20 230 Q 150 215 320 235 T 620 230" />
              </g>

              {/* River arc — a soft cool-gray sweep through the lower
                  third. The Han, approximately. */}
              <path
                className={s.mapRiver}
                d="M -20 470 Q 150 440 320 480 T 620 460"
                fill="none"
              />
              <text x="500" y="490" className={s.mapLabel} fontStyle="italic">
                river
              </text>

              {/* Park patch — irregular polygon, herb-tinted, low alpha. */}
              <path
                className={s.mapPark}
                d="M 70 320 L 215 305 L 235 365 L 195 405 L 90 410 L 55 360 Z"
              />
              <text x="105" y="360" className={s.mapLabel}>
                PARK
              </text>

              {/* Streets — three primary, one diagonal connector. */}
              <g className={s.mapStreets}>
                <path d="M -20 350 L 620 360" />
                <path d="M 380 -20 Q 360 200 388 400 T 365 620" fill="none" />
                <path d="M 50 80 Q 200 250 388 360" fill="none" />
                <path d="M -20 540 L 620 545" />
              </g>

              {/* Block labels — distant landmarks. */}
              <text x="60" y="155" className={s.mapLabel}>
                STATION
              </text>
              <text x="450" y="200" className={s.mapLabel}>
                BAKERY
              </text>
              <text x="120" y="540" className={s.mapLabel}>
                CORNER STORE
              </text>

              {/* Venue marker — a bold tomato dot with a star pulse and
                  a curved leader line pointing to a label. */}
              <g transform="translate(388, 360)">
                <circle r="22" className={s.mapMarkerRing} fill="none" />
                <circle r="10" className={s.mapMarker} />
                <path
                  d="M 22 -8 Q 60 -30 110 -42"
                  className={s.mapLeader}
                  fill="none"
                />
                <text
                  x="115"
                  y="-38"
                  className={s.mapMarkerLabel}
                  fontStyle="italic"
                >
                  the garden
                </text>
                <text x="115" y="-22" className={s.mapMarkerSub}>
                  est. 14:00
                </text>
              </g>

              {/* Compass rose — top-right. Tomato N-arrow over a
                  thin neutral ring. */}
              <g transform="translate(540, 75)" className={s.mapCompass}>
                <circle r="26" />
                <line
                  x1="0"
                  y1="-22"
                  x2="0"
                  y2="-3"
                  className={s.mapCompassN}
                />
                <line x1="0" y1="3" x2="0" y2="18" />
                <line x1="-18" y1="0" x2="-3" y2="0" />
                <line x1="3" y1="0" x2="18" y2="0" />
                <text y="-32" textAnchor="middle" className={s.mapLabel}>
                  N
                </text>
              </g>

              {/* Scale bar — bottom-left, decorative. */}
              <g transform="translate(40, 570)" className={s.mapScale}>
                <line x1="0" y1="0" x2="80" y2="0" />
                <line x1="0" y1="-4" x2="0" y2="4" />
                <line x1="40" y1="-3" x2="40" y2="3" />
                <line x1="80" y1="-4" x2="80" y2="4" />
                <text x="0" y="18" className={s.mapLabel}>
                  100m
                </text>
              </g>
            </svg>
            <figcaption className={s.mapCaption}>{MAP.caption}</figcaption>
          </figure>

          <aside className={s.mapAside}>
            <p className={s.mapAddressLabel}>The address</p>
            <p className={s.mapAddress}>
              {MAP.address.line1}
              <br />
              {MAP.address.line2}
            </p>

            <ul className={s.mapMetaList}>
              {MAP.metadata.map((item) => (
                <li key={item.label} className={s.mapMetaItem}>
                  <span className={s.mapMetaLabel}>{item.label}</span>
                  <span className={s.mapMetaValue}>{item.value}</span>
                </li>
              ))}
            </ul>

            <div className={s.mapCtas}>
              {MAP.ctas.map((cta) => (
                <a
                  key={cta.text}
                  className={s.mapCta}
                  href={cta.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {cta.text}
                  <span aria-hidden> ↗</span>
                </a>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
