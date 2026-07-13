"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useMotionValue } from "motion/react";
import {
  getLostFragranceRenderTier,
  readLostFragranceTierInput,
  type LostFragranceRenderTier
} from "../fragrance-tier";
import "./product-stage.css";

const LostFragranceScene = dynamic(
  () => import("../fragrance-scene").then((mod) => mod.LostFragranceScene),
  { ssr: false }
);

export type LostProductStageMedia = { url: string; alt?: string | null };

/**
 * The product-mode media surface — a drop-in for the PDP's left gallery cell. On the
 * WebGL tier it mounts the fragrance scene in `mode="product"` (a held studio shot of
 * the flacon idly tumbling on a near-black void); otherwise it degrades to the same
 * photographic fallback the gallery uses (hero image, or an initial-letter plate).
 *
 * Tier is resolved on the client after mount (it reads capability/motion prefs), so
 * the first paint is the fallback and the mesh swaps in only where it's supported —
 * no SSR/hydration mismatch, and reduced-motion users never get the canvas.
 *
 * `progress` is a stable, never-driven MotionValue: product mode ignores scroll, but
 * the shared scene component requires the prop. The scene forks on `mode` internally
 * (no water/plume/spring), so passing a frozen 0 is correct, not a placeholder.
 */
export function LostProductStage({
  productName,
  media
}: {
  productName: string;
  media: LostProductStageMedia | null;
}) {
  const progress = useMotionValue(0);
  const [tier, setTier] = useState<LostFragranceRenderTier>("editorial");
  const [sceneReady, setSceneReady] = useState(false);

  useEffect(() => {
    setTier(getLostFragranceRenderTier(readLostFragranceTierInput()));
  }, []);

  const showMesh = tier === "webgl";

  return (
    <section
      aria-label={productName}
      className="lost-product-stage relative aspect-[375/500] w-full overflow-hidden lg:aspect-auto lg:min-h-screen"
      data-lost-product-stage-ready={sceneReady}
      data-lost-product-stage-tier={tier}
    >
      {showMesh ? (
        <LostFragranceScene
          bagOpen={false}
          mode="product"
          onReady={() => setSceneReady(true)}
          progress={progress}
        />
      ) : media ? (
        <img
          alt={media.alt ?? productName}
          className="lost-product-stage-image"
          loading="eager"
          src={media.url}
        />
      ) : (
        <div aria-hidden className="lost-product-stage-fallback">
          {productName.slice(0, 1)}
        </div>
      )}
    </section>
  );
}
