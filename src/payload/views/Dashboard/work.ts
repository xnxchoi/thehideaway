import {
  documentHref,
  documentTitle,
  isVaultWorkCollection,
  lockTarget,
  lockerName,
  toWorkRow,
  VAULT_WORK_COLLECTIONS,
  type VaultWorkCollection,
  type VaultWorkRow
} from "./home";

export type VaultFindResult = { docs: Record<string, unknown>[] };

export type VaultFind = (args: {
  collection: string;
  depth?: number;
  draft?: boolean;
  limit?: number;
  overrideAccess?: boolean;
  req?: unknown;
  select?: Record<string, boolean>;
  sort?: string;
  user?: unknown;
  where?: Record<string, unknown>;
}) => Promise<VaultFindResult>;

const SECTION_LIMIT = 8;

async function findCollectionDocs(
  find: VaultFind,
  collection: VaultWorkCollection,
  user: unknown,
  errors: string[],
  where?: Record<string, unknown>
): Promise<Record<string, unknown>[]> {
  try {
    const result = await find({
      collection,
      depth: 0,
      draft: true,
      limit: SECTION_LIMIT,
      overrideAccess: false,
      select: {
        _status: true,
        slug: true,
        title: true,
        updatedAt: true
      },
      sort: "-updatedAt",
      user,
      where
    });
    return result.docs;
  } catch (error) {
    console.error(`[vault-home] ${collection} query failed`, error);
    errors.push(collection);
    return [];
  }
}

function rowsFromDocs(
  docs: Record<string, unknown>[],
  collection: VaultWorkCollection,
  adminRoute: string
): VaultWorkRow[] {
  return docs.flatMap((doc) => {
    const row = toWorkRow(doc, collection, adminRoute);
    return row ? [row] : [];
  });
}

export async function loadVaultHomeWork(args: {
  adminRoute: string;
  find: VaultFind;
  user: unknown;
}): Promise<{
  drafts: VaultWorkRow[];
  errors: string[];
  locked: VaultWorkRow[];
  recent: VaultWorkRow[];
}> {
  const { adminRoute, find, user } = args;
  const errors: string[] = [];

  const [draftSets, recentSets, lockResult] = await Promise.all([
    Promise.all(
      VAULT_WORK_COLLECTIONS.map((collection) =>
        findCollectionDocs(find, collection, user, errors, {
          _status: { equals: "draft" }
        }).then((docs) => rowsFromDocs(docs, collection, adminRoute))
      )
    ),
    Promise.all(
      VAULT_WORK_COLLECTIONS.map((collection) =>
        findCollectionDocs(find, collection, user, errors).then((docs) =>
          rowsFromDocs(docs, collection, adminRoute)
        )
      )
    ),
    find({
      collection: "payload-locked-documents",
      depth: 1,
      limit: 24,
      overrideAccess: false,
      sort: "-updatedAt",
      user
    }).catch((error) => {
      console.error("[vault-home] payload-locked-documents query failed", error);
      errors.push("payload-locked-documents");
      return { docs: [] as Record<string, unknown>[] };
    })
  ]);

  const drafts = draftSets
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, SECTION_LIMIT);

  const recent = recentSets
    .flat()
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, SECTION_LIMIT);

  const lockTargets = lockResult.docs.flatMap((lock) => {
    const target = lockTarget(lock.document);
    if (!target) return [];
    return [
      {
        lockedBy: lockerName(lock.user),
        target,
        updatedAt: typeof lock.updatedAt === "string" ? lock.updatedAt : ""
      }
    ];
  });

  const titles = await titlesForLocks(
    find,
    user,
    lockTargets.map((item) => item.target),
    errors
  );

  const locked: VaultWorkRow[] = lockTargets.flatMap(({ lockedBy, target, updatedAt }) => {
    if (!isVaultWorkCollection(target.collection)) return [];
    return [
      {
        collection: target.collection,
        href: documentHref(adminRoute, target.collection, target.id),
        id: target.id,
        lockedBy,
        title: titles.get(`${target.collection}:${target.id}`) ?? target.id,
        updatedAt
      }
    ];
  }).slice(0, SECTION_LIMIT);

  return { drafts, errors: [...new Set(errors)], locked, recent };
}

async function titlesForLocks(
  find: VaultFind,
  user: unknown,
  targets: Array<{ collection: VaultWorkCollection; id: string }>,
  errors: string[]
): Promise<Map<string, string>> {
  const titles = new Map<string, string>();
  const byCollection = new Map<VaultWorkCollection, string[]>();
  for (const target of targets) {
    const ids = byCollection.get(target.collection) ?? [];
    ids.push(target.id);
    byCollection.set(target.collection, ids);
  }

  await Promise.all(
    [...byCollection.entries()].map(async ([collection, ids]) => {
      try {
        const result = await find({
          collection,
          depth: 0,
          draft: true,
          limit: ids.length,
          overrideAccess: false,
          select: { title: true, slug: true },
          user,
          where: { id: { in: ids } }
        });
        for (const doc of result.docs) {
          if (typeof doc.id !== "string") continue;
          titles.set(`${collection}:${doc.id}`, documentTitle(doc));
        }
      } catch (error) {
        console.error(`[vault-home] ${collection} lock titles failed`, error);
        errors.push(collection);
      }
    })
  );

  return titles;
}
