"use client";
import { useEffect, useRef } from "react";
import "./mis.css";
import { MMM } from "@/components/layouts/Missing/mm";
import { gsap } from "gsap/all";
import { useVoyageur } from "@/stores/Routing/RP_Voyageur";

export function Missing() {
  const is404 = useVoyageur((l) => l.is404);
  const has = useRef(false);

  const curt = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    if (curt.current && is404 && !has.current) {
      has.current = true;
      MMM(curt.current);
      gsap.to(curt.current, {
        autoAlpha: 1,
        delay: 0.3,
        duration: 0.3,
        ease: "power4.inOut"
      });
    }
    return () => {
      document.addEventListener(
        "transFour",
        () => {
          has.current = false;
        },
        { once: true }
      );
    };
  }, [is404, curt]);

  return (
    <div
      ref={curt}
      className="curtains-canvas"
      style={{ opacity: 0, visibility: "hidden" }}
    ></div>
  );
}
