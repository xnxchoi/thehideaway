import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function getLostProductActiveImageFromScroll({
  galleryTop,
  imageCount,
  scrollY,
  slideHeight,
  viewportHeight
}: {
  galleryTop: number;
  imageCount: number;
  scrollY: number;
  slideHeight: number;
  viewportHeight: number;
}) {
  if (imageCount <= 1 || slideHeight <= 0) return 0;

  const activationLine = scrollY + viewportHeight * 0.55;
  const index = Math.floor((activationLine - galleryTop) / slideHeight);

  return Math.min(imageCount - 1, Math.max(0, index));
}

export function getLostProductDesktopSlideClassName({
  activeImage,
  index
}: {
  activeImage: number;
  index: number;
}) {
  return cn(
    "lost-product-slide sticky top-0 z-0 col-start-1 max-h-screen overflow-hidden",
    index === 0 && "row-start-1",
    activeImage === index && "is-active"
  );
}

export function getLostProductThumbClassName({
  activeImage,
  index,
  mobile = false
}: {
  activeImage: number;
  index: number;
  mobile?: boolean;
}) {
  return cn(
    "lost-product-thumb",
    mobile && "lost-product-thumb--mobile",
    activeImage === index && "is-active",
    !mobile && index < activeImage && "is-prev"
  );
}

export function getLostProductDesktopThumbStyle({
  activeImage,
  index
}: {
  activeImage: number;
  index: number;
}): CSSProperties | undefined {
  if (index >= activeImage) return undefined;

  return {
    opacity: 0,
    pointerEvents: "none",
    transform: "translate3d(0, 50%, 0) scale(0)"
  };
}
