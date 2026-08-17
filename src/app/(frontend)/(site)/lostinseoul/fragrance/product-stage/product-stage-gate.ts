/**
 * Whether a given product PDP should render the WebGL product stage (the idly
 * tumbling flacon on a studio void) instead of the standard image gallery.
 *
 * The flacon mesh is the fragrance's own geometry — it is only meaningful for the
 * fragrance product. Every other product keeps the photographic gallery. The two
 * slugs are compared server-side (the fragrance product is discovered by category
 * via `getLostFragranceData`); a missing slug on either side is never a match.
 */
export function shouldEnableLostProductStage(input: {
  productSlug: string | null | undefined;
  fragranceSlug: string | null | undefined;
}): boolean {
  const { productSlug, fragranceSlug } = input;
  if (!productSlug || !fragranceSlug) return false;
  return productSlug === fragranceSlug;
}
