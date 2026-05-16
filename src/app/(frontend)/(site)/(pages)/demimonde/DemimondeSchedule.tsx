import s from "./Demimonde.module.scss";
import { SCHEDULE } from "./content";

export function DemimondeSchedule() {
  return (
    <section
      className={`${s.section} ${s.schedule}`}
      aria-labelledby="schedule"
    >
      <div className={s.sectionInner}>
        <header className={s.sectionHead}>
          <span className={s.sectionEyebrow}>{SCHEDULE.eyebrow}</span>
          <h2 id="schedule" className={s.sectionTitle}>
            {SCHEDULE.title}
          </h2>
          <p className={s.sectionLede}>{SCHEDULE.lede}</p>
        </header>

        {SCHEDULE.days.map((day) => (
          <div key={day.label} className={s.scheduleDay}>
            <div className={s.scheduleDayHeader}>
              <div className={s.scheduleDayLabel}>{day.label}</div>
              <h3 className={s.scheduleDayTitle}>{day.title}</h3>
              <div className={s.scheduleDayDate}>{day.date}</div>
            </div>

            <div className={s.scheduleBlocks}>
              {day.blocks.map((block) => (
                <div key={block.time} className={s.scheduleBlock}>
                  <div className={s.scheduleTime}>{block.time}</div>
                  <div className={s.scheduleEvent}>
                    <strong>
                      {block.head}
                      {"star" in block && block.star ? (
                        <span className={s.scheduleStar} aria-label="featured">
                          ★
                        </span>
                      ) : null}
                    </strong>
                    <p>
                      {block.body}
                      {"link" in block && block.link ? (
                        <>
                          {" "}
                          <a
                            href={block.link.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {block.link.text}
                          </a>
                        </>
                      ) : null}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
