"use client";
import { useRPStore } from "src/providers/RP_Pro";
import { useEffect, useState } from "react";
import { Button } from "src/components/ui/button";

export function MainButton() {
  const cm = useRPStore((store) => store.cbMenu);
  const setMain = useRPStore((store) => store.setCBmenu);
  const [cur, setCur] = useState<false | string>(false);
  useEffect(() => {
    cm === "main" ? setCur(false) : setCur("main");
  }, [cm]);
  return (
    <Button
      className="menu-float__hamburger js-menufloat-hamburger"
      onClick={() => {
        setMain(cur);
      }}
      type="button"
      data-init=""
    >
      <div />
      <div />
      <div />
    </Button>
  );
}
