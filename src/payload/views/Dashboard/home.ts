export const VAULT_WORK_COLLECTIONS = ["posts", "surf", "pages"] as const;

export type VaultWorkCollection = (typeof VAULT_WORK_COLLECTIONS)[number];

export type VaultWorkStatus = "draft" | "published";

export type VaultWorkRow = {
  collection: VaultWorkCollection;
  href: string;
  id: string;
  lockedBy?: string;
  status?: VaultWorkStatus;
  title: string;
  updatedAt: string;
};

export function isVaultWorkCollection(
  value: string
): value is VaultWorkCollection {
  return (VAULT_WORK_COLLECTIONS as readonly string[]).includes(value);
}

export function documentTitle(doc: Record<string, unknown>): string {
  if (typeof doc.title === "string" && doc.title.trim()) return doc.title.trim();
  if (typeof doc.slug === "string" && doc.slug.trim()) return doc.slug.trim();
  return String(doc.id ?? "");
}

export function documentHref(
  adminRoute: string,
  collection: string,
  id: string
): string {
  const base = adminRoute.endsWith("/") ? adminRoute.slice(0, -1) : adminRoute;
  return `${base}/collections/${collection}/${id}`;
}

export function documentStatus(
  doc: Record<string, unknown>
): VaultWorkStatus | undefined {
  if (doc._status === "draft" || doc._status === "published") return doc._status;
  return undefined;
}

export function lockTarget(
  document: unknown
): { collection: VaultWorkCollection; id: string } | null {
  if (!document || typeof document !== "object") return null;
  const relation = document as { relationTo?: unknown; value?: unknown };
  if (typeof relation.relationTo !== "string") return null;
  if (!isVaultWorkCollection(relation.relationTo)) return null;
  const value = relation.value;
  if (typeof value === "string" && value) {
    return { collection: relation.relationTo, id: value };
  }
  if (value && typeof value === "object" && "id" in value) {
    const id = (value as { id: unknown }).id;
    if (typeof id === "string" && id) {
      return { collection: relation.relationTo, id };
    }
  }
  return null;
}

export function lockerName(user: unknown): string | undefined {
  if (!user || typeof user !== "object") return undefined;
  const record = user as {
    email?: unknown;
    firstName?: unknown;
    slug?: unknown;
  };
  if (typeof record.firstName === "string" && record.firstName.trim()) {
    return record.firstName.trim();
  }
  if (typeof record.slug === "string" && record.slug.trim()) {
    return record.slug.trim();
  }
  if (typeof record.email === "string" && record.email.trim()) {
    return record.email.trim();
  }
  return undefined;
}

export function toWorkRow(
  doc: Record<string, unknown>,
  collection: VaultWorkCollection,
  adminRoute: string
): VaultWorkRow | null {
  if (typeof doc.id !== "string" || !doc.id) return null;
  return {
    collection,
    href: documentHref(adminRoute, collection, doc.id),
    id: doc.id,
    status: documentStatus(doc),
    title: documentTitle(doc),
    updatedAt: typeof doc.updatedAt === "string" ? doc.updatedAt : ""
  };
}

export function formatWorkDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export function vaultHomeLocale(code: string | undefined): "en" | "ko" {
  return code === "ko" ? "ko" : "en";
}

export type VaultHomeCatalog = {
  collections: Record<string, string>;
  columns: Record<string, string>;
  drafts: string;
  emptyDrafts: string;
  emptyLocked: string;
  emptyRecent: string;
  loadError: string;
  locked: string;
  recent: string;
  status: Record<string, string>;
  title: string;
};

export async function loadVaultHomeCatalog(
  locale: "en" | "ko"
): Promise<VaultHomeCatalog> {
  const messages = (await import(`../../../../messages/${locale}.json`))
    .default as { Vault: { home: VaultHomeCatalog } };
  return messages.Vault.home;
}

export function readVaultHomeString(
  catalog: VaultHomeCatalog,
  path: string
): string {
  const parts = path.split(".");
  let current: unknown = catalog;
  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return path;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}
