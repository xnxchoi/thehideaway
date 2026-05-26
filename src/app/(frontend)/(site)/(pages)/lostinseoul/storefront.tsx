import type { LostProductCard } from "@/lib/lost-commerce/queries";
import {
  LostAnnouncementBar,
  LostCommerceChromeStyles,
  LostCursorBridge,
  LostHeader,
  LostHero,
  LostLenisBridge,
  LostProductSection,
  LostStatement
} from "./components";

type Props = {
  title: string;
  eyebrow: string;
  lede: string;
  announcement: string;
  productsLabel: string;
  emptyLabel: string;
  cartLabel: string;
  backLabel: string;
  checkoutLabel: string;
  removeLabel: string;
  totalLabel: string;
  watchLabel: string;
  closeVideoLabel: string;
  playVideoLabel: string;
  pauseVideoLabel: string;
  muteVideoLabel: string;
  unmuteVideoLabel: string;
  shopLabel: string;
  archiveLabel: string;
  collectionLabel: string;
  yearLabel: string;
  objectsLabel: string;
  incomingLabel: string;
  products: LostProductCard[];
  drops: Array<{ title: string; slug: string; kicker?: string; lede?: string }>;
};

const FALLBACK_HERO = "/assets/env_hdr1.webp";
const FALLBACK_HERO_VIDEO = "/assets/lostinseoul/oflyn/hero-reference.mp4";

export function LostStorefront({
  announcement,
  archiveLabel,
  backLabel,
  cartLabel,
  checkoutLabel,
  closeVideoLabel,
  collectionLabel,
  drops,
  emptyLabel,
  eyebrow,
  incomingLabel,
  lede,
  muteVideoLabel,
  objectsLabel,
  pauseVideoLabel,
  playVideoLabel,
  products,
  productsLabel,
  removeLabel,
  shopLabel,
  title,
  totalLabel,
  unmuteVideoLabel,
  watchLabel,
  yearLabel
}: Props) {
  const featureImage = products[0]?.imageUrl ?? FALLBACK_HERO;
  const featureVideo = products[0]?.heroVideoUrl ?? FALLBACK_HERO_VIDEO;

  return (
    <main className="lost-commerce-root relative z-[1001] min-h-screen bg-[var(--lost-paper)] text-[var(--lost-paper-ink)] selection:bg-black selection:text-[var(--lost-paper)]">
      <LostLenisBridge />
      <LostCursorBridge />
      <LostCommerceChromeStyles />
      <LostAnnouncementBar>{announcement}</LostAnnouncementBar>
      <LostHeader
        archiveLabel={archiveLabel}
        backLabel={backLabel}
        cartLabel={cartLabel}
        checkoutLabel={checkoutLabel}
        drops={drops}
        emptyLabel={emptyLabel}
        removeLabel={removeLabel}
        shopLabel={shopLabel}
        totalLabel={totalLabel}
      />
      <LostHero
        closeLabel={closeVideoLabel}
        collectionLabel={collectionLabel}
        eyebrow={eyebrow}
        imageUrl={featureImage}
        muteLabel={muteVideoLabel}
        pauseLabel={pauseVideoLabel}
        playLabel={playVideoLabel}
        productsLabel={productsLabel}
        title={title}
        unmuteLabel={unmuteVideoLabel}
        videoUrl={featureVideo}
        watchLabel={watchLabel}
        yearLabel={yearLabel}
      />
      <LostStatement
        count={products.length}
        lede={lede}
        objectsLabel={objectsLabel}
      />
      <LostProductSection
        cartLabel={cartLabel}
        emptyLabel={emptyLabel}
        incomingLabel={incomingLabel}
        products={products}
        productsLabel={productsLabel}
      />
    </main>
  );
}
