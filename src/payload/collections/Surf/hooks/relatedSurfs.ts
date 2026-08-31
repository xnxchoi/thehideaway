type RelatedSurfsFilter = true | { id: { not_in: string[] } };

export async function defaultRelatedSurfs(_args?: unknown): Promise<never[]> {
  return [];
}

export function filterRelatedSurfs(args: { id?: unknown }): RelatedSurfsFilter {
  if (typeof args.id !== "string" || !args.id) return true;
  return { id: { not_in: [args.id] } };
}
