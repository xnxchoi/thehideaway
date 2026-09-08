import Image from "next/image";

type LostCartLineImageSurface = "overlay" | "page";

const DIMENSIONS: Record<LostCartLineImageSurface, number> = {
  overlay: 72,
  page: 116
};

export function getLostCartLineImageSizes(surface: LostCartLineImageSurface) {
  return surface === "page" ? "(min-width: 768px) 116px, 112px" : "72px";
}

export function getLostCartLineImageConfig(surface: LostCartLineImageSurface) {
  const dimension = DIMENSIONS[surface];

  return {
    height: dimension,
    sizes: getLostCartLineImageSizes(surface),
    unoptimized: true,
    width: dimension
  } as const;
}

export function LostCartLineImage({
  alt,
  src,
  surface
}: {
  alt: string;
  src: string;
  surface: LostCartLineImageSurface;
}) {
  const config = getLostCartLineImageConfig(surface);

  return (
    <Image
      alt={alt}
      className="h-full w-full object-cover grayscale"
      src={src}
      {...config}
    />
  );
}
