type ProductStoryMedia = {
  alt?: string | null;
  url: string;
};

type ProductEvidenceInput = {
  galleryPreview: ProductStoryMedia[];
  imageAlt?: string | null;
  imageUrl?: string | null;
  name: string;
};

export function getLostProductEvidenceSummary(summary?: string | null) {
  const normalized = summary?.trim();

  return normalized ? normalized : null;
}

export function getLostProductStoryImages(product: ProductEvidenceInput) {
  if (product.galleryPreview.length > 0) return product.galleryPreview;
  if (!product.imageUrl) return [];

  return [
    {
      alt: product.imageAlt?.trim() || product.name,
      url: product.imageUrl
    }
  ];
}

export function getLostProductFallbackMark(name: string) {
  const [firstCharacter] = Array.from(name.trim());

  return firstCharacter ? firstCharacter.toUpperCase() : "L";
}
