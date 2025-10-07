import { useRPStore } from "@/providers/RP_Pro";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Link } from "@/components/UX/Link/Link";
import { useCursorHandlers } from "@/components/core/cursorWrapper";
import { useNotifications } from "@/providers/Notifications";
import { useIsMobile } from "@/providers/MiddleMan";

export const Notifications = (l) => {
  const c: HTMLDivElement[] = [];
  const handler = useCursorHandlers("dom");
  const { onMouseEnter, onMouseLeave } = handler;
  const { notifications } = useNotifications(),
    navIsOpen = useRPStore((l) => l.navIsOpen);
  const notificationIDs = useRef<Array<string>>([]);
  const notifItems = useRef<HTMLDivElement[]>([]),
    { isMobile } = useIsMobile();
  const cont = useRef<HTMLDivElement>(null!);
  const [dismissedNotif, setDismissedNotif] = useState<string[]>([]);
  const [dismissedIndexAr, setDismissedIndexAr] = useState<number[]>([]);
  useEffect(() => {
    setDismissedNotif((r) => [...r]);
  }, [dismissedIndexAr]);
  useEffect(() => {
    dismissedNotif.forEach((i) => {
      const d = dismissedIndexAr.indexOf(i);
      gsap.to(notifItems.current[i], {});
    });
  }, [dismissedNotif]);

  return (
    <div ref={cont} className="flex flex-col items-center justify-start">
      {notifications.map((h, i) => {
        const content = h.content;
        return (
          <div
            key={h.title}
            ref={(el) => {
              el && (notifItems.current[i] = el);
            }}
            className="notif_item-container"
          >
            <div className="notif_item-pad-container">
              <article
                className="notif__item"
                data-themed="background-color,border-color"
                data-type="type"
                style={{}}
              >
                <button
                  className="notif_item-xbutton"
                  aria-label="Close notification"
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                  onClick={() => {
                    setDismissedIndexAr((l) => [...l, i]);
                  }}
                >
                  <svg
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="NotificationItem_xIcon__m89Rr"
                  >
                    <path
                      data-themed="stroke"
                      d="M2.625 2.625L9.375 9.375"
                      stroke="currentColor"
                      style={{}}
                    />
                    <path
                      data-themed="stroke"
                      d="M2.625 9.375L9.375 2.625"
                      stroke="currentColor"
                      style={{}}
                    />
                  </svg>
                </button>
                <Link
                  href="https://suno.com/home"
                  className="notif_item-wrapper"
                  target="_blank"
                  rel="noreferrer"
                >
                  <h1
                    className="notif_item-title"
                    data-themed="color"
                    style={{}}
                  ></h1>
                  <div className="notif_item-image--container">
                    <div className="notif_item-image">
                      <picture data-preloader="false">
                        <source
                          srcSet="https://cdn.sanity.io/images/nuxb3jim/production/5a611ce381477e6425b1dd6519ab3c80ef2411af-500x500.png?w=120&q=80&fm=webp"
                          media="(min-width: 1px)"
                        />
                        <img
                          alt=""
                          data-preloader="false"
                          loading="lazy"
                          width={500}
                          height={500}
                          decoding="async"
                          data-nimg={1}
                          className="SanityImage_SanityImage__m6nBd SanityImage_loaded__QhhIt"
                          src="https://cdn.sanity.io/images/nuxb3jim/production/5a611ce381477e6425b1dd6519ab3c80ef2411af-500x500.png?w=500&q=75&fit=clip&auto=format"
                          style={{ color: "transparent" }}
                        />
                      </picture>
                    </div>
                    <p
                      className="notif_item-desc"
                      data-themed="color"
                      style={{}}
                    >
                      {content}{" "}
                    </p>
                  </div>
                </Link>
              </article>
            </div>
          </div>
        );
      })}
    </div>
  );
};
