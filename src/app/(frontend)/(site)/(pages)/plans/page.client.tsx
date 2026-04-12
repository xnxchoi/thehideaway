"use client";
import "./__plans.scss";
import dynamic from "next/dynamic";

const Polaroid = dynamic(
  () => import("@/components/UX/Polaroid/index").then((m) => m.RP_POLAROID),
  { ssr: false }
);
const PageClient = () => {
  /* Force the header to be dark mode while we have an image behind it */

  return (
    <>
      <Polaroid />
    </>
  );
};

export default PageClient;
