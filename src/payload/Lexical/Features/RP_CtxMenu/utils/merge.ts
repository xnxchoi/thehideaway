import type {
  ContextMenuContributor,
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext
} from "../types";

/**
 * Run every contributor in order and merge their output into a flat list of
 * groups. Groups with the same key have their items concatenated. Items with
 * the same key keep the first occurrence (contributor order wins).
 */
export function composeMenuGroups(
  contributors: readonly ContextMenuContributor[],
  context: EditorContext
): ContextMenuGroup[] {
  const groupMap = new Map<
    string,
    {
      key: string;
      label?: string;
      order: number;
      items: ContextMenuItem[];
      seenKeys: Set<string>;
    }
  >();

  for (const contributor of contributors) {
    const groups = contributor.resolve(context);
    if (!groups) continue;

    for (const group of groups) {
      let bucket = groupMap.get(group.key);
      if (!bucket) {
        bucket = {
          key: group.key,
          label: group.label,
          order: group.order ?? 100,
          items: [],
          seenKeys: new Set()
        };
        groupMap.set(group.key, bucket);
      } else {
        // Preserve first-defined label and lowest order.
        if (bucket.label === undefined && group.label !== undefined) {
          bucket.label = group.label;
        }
        if (group.order !== undefined) {
          bucket.order = Math.min(bucket.order, group.order);
        }
      }

      for (const item of group.items) {
        if (bucket.seenKeys.has(item.key)) continue;
        bucket.seenKeys.add(item.key);
        bucket.items.push(item);
      }
    }
  }

  const groups = Array.from(groupMap.values())
    .map((b) => ({
      key: b.key,
      label: b.label,
      order: b.order,
      items: sortItems(b.items)
    }))
    .filter((g) => g.items.length > 0);

  groups.sort((a, b) => a.order - b.order);
  return groups.map(({ order, ...g }) => ({ ...g }));
}

function sortItems(items: readonly ContextMenuItem[]): ContextMenuItem[] {
  return [...items].sort((a, b) => (a.order ?? 100) - (b.order ?? 100));
}
