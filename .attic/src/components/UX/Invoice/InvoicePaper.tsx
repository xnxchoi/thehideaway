import { PaperContent } from "./PaperContent";
import { PaperEdge, PaperTexture } from "./PaperTexture";
import type { InvoiceDisplay } from "./types";

type InvoicePaperProps = {
  invoice: InvoiceDisplay;
  textureId: string;
};

/**
 * Standalone CSS-rendered invoice paper. Used for the focused/print view and
 * any non-3D rendering. The R3F path uses a mesh + Drei <Html> with
 * <PaperContent /> directly so real lights can cast real shadows on the mesh.
 */
export function InvoicePaper({ invoice, textureId }: InvoicePaperProps) {
  return (
    <div
      className="relative isolate aspect-[1/1.55] w-full overflow-hidden bg-[#fbfaf6] text-neutral-900"
      style={{
        // Single-source lighting: warm wash upper-left, deep falloff lower-right
        backgroundImage:
          "radial-gradient(80% 70% at 18% 12%, rgba(255,240,210,0.18), transparent 55%), radial-gradient(110% 90% at 100% 100%, rgba(40,30,20,0.12), transparent 60%)",
        // Directional shadow — heavy bottom-right, soft contact under-left
        boxShadow:
          "28px 38px 70px -24px rgba(0,0,0,0.55), 8px 14px 24px -10px rgba(0,0,0,0.30), -2px 2px 6px -2px rgba(0,0,0,0.10)"
      }}
    >
      <PaperTexture id={textureId} />
      <PaperEdge side="top" />
      <PaperEdge side="bottom" />
      <div className="relative z-10 h-full">
        <PaperContent invoice={invoice} />
      </div>
    </div>
  );
}
