"use client";

import { useLenis } from "lenis/react";
import { forwardRef, HTMLAttributes } from "react";

import { Link } from "@/components/UX/Link/Link";
import { useRPStore } from "@/providers/RP_Pro";
import { cn } from "@/lib/utils";

export const TopMenu = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>((props, ref) => {
  const lenis = useLenis();
  const cbOpen = useRPStore((store) => store.cbMenu);
  const setM = useRPStore((store) => store.setCBmenu);

  const attr = { ...props };
  if (lenis) {
    Object.assign(attr, { "data-lenis-prevent": "" });
  }
  return (
    <div className="menu-float__top" ref={ref} {...attr}>
      <div
        className={cn("menu-float__menu menu-main", {
          "is-active": cbOpen === "main"
        })}
        onMouseLeave={() => setM(false)}
        id="menu-main"
      >
        <div
          className={
            cbOpen === "main"
              ? "menu-float__menu-content" + " is-show"
              : "menu-float__menu-content"
          }
        >
          <div className="menu-float__menu--main">
            <div className="style-2 menu-float__menu-col">
              <div className="menu-float__menu-row style-1">
                <div className="menu-float__menu-section">The Magazine</div>
                <ul className="menu-float__menu-nav">
                  <li>
                    <a
                      className="menu-float__sub-item"
                      href="/all-stories"
                      title="Reflections"
                    >
                      Reflections
                    </a>
                  </li>
                  <li>
                    <a
                      className="menu-float__sub-item"
                      href="/feature"
                      title="Features"
                    >
                      Feature
                    </a>
                  </li>
                </ul>
              </div>
              <div className="menu-float__menu-row style-1">
                <div className="menu-float__menu-section">h.a.</div>
                <ul className="menu-float__menu-nav">
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/manifesto/"
                      title="manifesto"
                    >
                      WHO WE ARE
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="/aquila"
                      title="AQUILA"
                    >
                      THE AQUILA
                    </Link>
                  </li>
                </ul>
              </div>
            </div>{" "}
            <div className="style-2 menu-float__menu-col">
              <div className="menu-float__menu-row style-1">
                <div className="menu-float__menu-section">My Archive</div>
                <ul className="menu-float__menu-nav">
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/suite/publications/"
                      title="My Stories"
                    >
                      My Stories
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/x/sean-choi/cv"
                      title="My CV"
                    >
                      My CV
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/x/sean-choi/"
                      title="My Experiences"
                    >
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/x/sean-choi/collections"
                      title="My Collections"
                    >
                      My Collections
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="style-2 menu-float__menu-col">
              <div className="menu-float__menu-row style-1">
                <div className="menu-float__menu-section">Settings</div>
                <ul className="menu-float__menu-nav">
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/suite/"
                      title="계정 대시보드"
                    >
                      설정
                    </Link>
                  </li>
                  <li>
                    <Link
                      className="menu-float__sub-item"
                      href="https://hideawayseoul.com/suite/profile/"
                      title="내 프로필"
                    >
                      프로필 수정
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="style-2 menu-float__menu-row">
                <div className="menu-float__menu-section">Shop</div>
              </div>
              <div className="style-2 menu-float__menu-row">
                <div className="menu-float__menu-section">
                  <Link className="logout-link" style={{}}>
                    체크 아웃
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        id="menu-search"
        className={
          cbOpen === "search"
            ? "menu-float__menu menu-search" + " is-active"
            : "menu-float__menu menu-search"
        }
      >
        <div
          className={
            cbOpen === "search"
              ? "menu-float__menu-content" + " is-show"
              : "menu-float__menu-content"
          }
        >
          <div className="menu-float__search-container">
            <div className="loading">
              <div className="loading__spinner" />
            </div>
            <label htmlFor="searcher" className="estt-search-count">
              Search For Anything (We Have)
            </label>
            <div className="menu-float__search-wrap" data-lenis-prevent="">
              <ul className="menu-float__search-res" />
            </div>
            <div id="gradientSearch" />
          </div>
        </div>
        <input type="text" id="searcher" className="menu-float__search" />
      </div>
      <div
        className={
          cbOpen === "write"
            ? "menu-float__menu menu-write" + " is-active"
            : "menu-float__menu menu-write"
        }
        id="menu-acceass"
      >
        <div
          className={
            cbOpen === "write"
              ? "menu-float__menu-content" + " is-show"
              : "menu-float__menu-content"
          }
        >
          <ul className="button--rows">
            <li>
              <Link className="button--rounded">
                <div>
                  <span style={{ display: "inline-block", lineHeight: 1 }}>
                    + CV Experience
                  </span>
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/suite/write/?storyBy=6&storyType=post"
                className="button--rounded"
              >
                <p>+ Story</p>
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});
