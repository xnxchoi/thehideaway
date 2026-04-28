import { instrumentSerif } from "./fonts";

type InvoiceSleeveProps = {
  /** Label embossed on the sleeve. Default "RECEIPT". */
  label?: string;
};

/**
 * The oxblood leather sleeve. Sits on top of the paper in 'sealed' state,
 * slides down + out during reveal. Visual only — animated by the parent.
 */
export function InvoiceSleeve({ label = "RECEIPT" }: InvoiceSleeveProps) {
  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{
        // Photographic lighting: warm key upper-left, deep shadow lower-right.
        // Layered radial highlights over the leather base for dimension.
        background:
          "radial-gradient(70% 60% at 15% 10%, rgba(180,90,90,0.55), transparent 55%), radial-gradient(90% 80% at 100% 100%, rgba(0,0,0,0.65), transparent 60%), linear-gradient(150deg, #5a1414 0%, #4a1010 60%, #380a0a 100%)",
        boxShadow:
          "inset -20px -30px 60px rgba(0,0,0,0.55), inset 18px 14px 40px rgba(255,200,160,0.06), inset 0 1px 0 rgba(255,255,255,0.04), 22px 30px 50px -22px rgba(0,0,0,0.7)"
      }}
    >
      {/* Cross-hatch leather texture */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.18]"
      >
        <defs>
          <pattern
            id="leather-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="6" stroke="#000" strokeWidth="0.6" />
            <line x1="3" y1="0" x2="3" y2="6" stroke="#fff" strokeWidth="0.3" />
          </pattern>
          <filter id="leather-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="2.2"
              numOctaves={2}
              stitchTiles="stitch"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0.25 0"
            />
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#leather-hatch)" />
        <rect width="100%" height="100%" filter="url(#leather-grain)" />
      </svg>

      {/* Inner debossed border */}
      <div
        className="pointer-events-none absolute inset-3 border border-[#3a0e0e]/60"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 1px 0 rgba(255,255,255,0.02)"
        }}
      />

      {/* Embossed wordmark */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <span
            className={`${instrumentSerif.className} text-3xl tracking-[0.05em] text-[#1a0606]/90`}
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.06), 0 -1px 0 rgba(0,0,0,0.4)"
            }}
          >
            The Hideaway
          </span>
          <span
            className="font-mono text-[9px] tracking-[0.4em] text-[#1a0606]/80 uppercase"
            style={{
              textShadow:
                "0 1px 0 rgba(255,255,255,0.05), 0 -1px 0 rgba(0,0,0,0.3)"
            }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Top opening lip — a thin highlight where the paper protrudes */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[3px]"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(255,255,255,0.04))"
        }}
      />
    </div>
  );
}
