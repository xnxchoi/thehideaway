/**
 * Calculates a simple composite relevance score for a search index document.
 *
 * Three orthogonal components — editorial weight, freshness, content richness —
 * each bounded so no single axis can dominate. No AI, no embeddings.
 *
 *  priority_weight  0–50   Manual editorial control via the `priority` field
 *  recency_weight   0–30   Exponential decay: ~30 fresh → ~4 at one year
 *  richness_weight  0–25   Content completeness: image, description, tags, category
 *
 * Typical range: 0–105
 */
export function calculateSearchScore({
  priority,
  createdAt,
  hasImage,
  hasDescription,
  hasTags,
  hasCategory
}: {
  priority?: number | null;
  createdAt: string;
  hasImage: boolean;
  hasDescription: boolean;
  hasTags: boolean;
  hasCategory: boolean;
}): number {
  const priorityWeight = Math.min(priority ?? 0, 50);

  const ageInDays =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyWeight = 30 * Math.exp(-ageInDays / 180);

  const richnessWeight =
    (hasImage ? 8 : 0) +
    (hasDescription ? 8 : 0) +
    (hasTags ? 5 : 0) +
    (hasCategory ? 4 : 0);

  return Math.round(priorityWeight + recencyWeight + richnessWeight);
}
