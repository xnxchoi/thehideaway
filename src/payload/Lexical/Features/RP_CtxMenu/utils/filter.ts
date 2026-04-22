import type { EditorContext, ImportFilter } from "../types";

function matches(
  key: string,
  entries: ReadonlyArray<string | RegExp>
): boolean {
  for (const entry of entries) {
    if (typeof entry === "string") {
      if (entry === key) return true;
    } else if (entry.test(key)) {
      return true;
    }
  }
  return false;
}

/**
 * Decide whether a raw item survives an import filter. `key` is the unique
 * identifier used for string/regex matching; `item` is the raw source item
 * passed to the predicate.
 */
export function applyImportFilter<T>(args: {
  key: string;
  item: T;
  context: EditorContext;
  filter?: ImportFilter<T>;
}): boolean {
  const { key, item, context, filter } = args;
  if (!filter) return true;

  if (filter.include && filter.include.length > 0) {
    if (!matches(key, filter.include)) return false;
  }
  if (filter.exclude && filter.exclude.length > 0) {
    if (matches(key, filter.exclude)) return false;
  }
  if (filter.predicate) {
    return filter.predicate({ item, context });
  }
  return true;
}
