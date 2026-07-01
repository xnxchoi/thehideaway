type LostProductSectionMetaInput = {
  cartLabel: string;
  incomingLabel: string;
  productCount: number;
  searchQuery: string;
  searchResultsLabel: string;
  sectionMetaLabel?: string;
};

export function getLostProductSectionMetaLabel({
  cartLabel,
  incomingLabel,
  productCount,
  searchQuery,
  searchResultsLabel,
  sectionMetaLabel
}: LostProductSectionMetaInput): string {
  const count = productCount.toString().padStart(2, "0");

  if (searchQuery.trim().length > 0) {
    return `${searchResultsLabel} / ${count}`;
  }

  if (sectionMetaLabel) {
    return sectionMetaLabel;
  }

  if (productCount === 0) {
    return `${incomingLabel} / 00`;
  }

  return `${cartLabel} / 00`;
}
