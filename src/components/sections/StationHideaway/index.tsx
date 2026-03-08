import { Tape3DScene } from "@/components/UX/TapePlayer/visuals/Tape3DScene";

export const StationHideaway = () => {
  return (
    <section
      className={
        "relative z-1 flex w-full flex-col items-center gap-x-[4em] gap-y-[4em] overflow-hidden pt-[1.2em] pb-[4em]"
      }
    >
      <div className="relative top-0 grid h-auto min-h-screen w-full grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-x-6 gap-y-6 bg-scroll px-6 pt-130 pb-78 max-xs:py-64">
        <Tape3DScene />
        <div></div>
      </div>
    </section>
  );
};
