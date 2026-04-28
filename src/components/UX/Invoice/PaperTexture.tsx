type PaperTextureProps = {
  /** Unique id so multiple instances on one page don't collide. */
  id: string;
  /** 0–1; the grain alpha. Default 0.06. */
  intensity?: number;
};

export function PaperTexture({ id, intensity = 0.06 }: PaperTextureProps) {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full mix-blend-multiply"
    >
      <defs>
        <filter id={`${id}-grain`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.6"
            numOctaves={2}
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values={`0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 0 0
                     0 0 0 ${intensity} 0`}
          />
        </filter>
      </defs>
      <rect width="100%" height="100%" filter={`url(#${id}-grain)`} />
    </svg>
  );
}

type PaperEdgeProps = {
  /** Top or bottom — controls gradient direction. */
  side: "top" | "bottom";
};

/** A subtle inner shadow at the paper edge so it reads as a sheet, not a div. */
export function PaperEdge({ side }: PaperEdgeProps) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 h-6"
      style={{
        [side]: 0,
        background:
          side === "top"
            ? "linear-gradient(to bottom, rgba(0,0,0,0.06), transparent)"
            : "linear-gradient(to top, rgba(0,0,0,0.06), transparent)"
      }}
    />
  );
}
