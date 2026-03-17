import { Admin, Profile, User } from "@/payload-types";
import { LockedCollections } from "@/payload/plugins";
import { allowListField } from "@/payload/plugins/locker/fields/allowlist";
import { authorityField } from "@/payload/plugins/locker/fields/authority";
import { lockBoxField } from "@/payload/plugins/locker/fields/lockbox";
import { LockerPluginConfig } from "@/payload/plugins/locker/plugin";
import { CollectionMap } from "@/payload/plugins/plugin-search/utilities/syncDocAsSearchIndex";
import { RP_Roles } from "@/stores/Notification/NotificationStore";
import { arraysEqualContents } from "@/utilities/compareArrays";
import { mergeFields } from "@/utilities/mergeFields";
import { KeysOfValue } from "@/utilities/typeUtilities";
import { SerializedEditorState } from "lexical";
import { revalidatePath } from "next/cache";
import {
  Access,
  AccessArgs,
  AccessResult,
  type CollectionAfterChangeHook,
  CollectionAfterReadHook,
  CollectionConfig,
  CollectionSlug,
  DataFromCollectionSlug,
  Where
} from "payload";
import { roleToAuthority } from "./fields/authority/utils";

export function isDraftsEnabled<T extends CollectionSlug>({
  collection
}: {
  collection: CollectionConfig<T>;
}): boolean {
  const v = collection.versions;
  const d = Boolean(
    v && typeof v === "object" && v.drafts !== undefined && v.drafts
  );
  return d;
}
const authorlessLockedReadAccess = (args: {
  slug: CollectionSlug;
  collection: CollectionConfig;
}) => {
  const { slug } = args;

  if (slug === "pages") {
    return (args: AccessArgs): AccessResult => {
      const { req } = args;
      const { user } = req;
      if (user?.role === "admin") return true;
      if (!user) {
        return {
          and: [
            {
              _status: {
                equals: "published"
              }
            },
            {
              or: [
                {
                  locked: {
                    not_equals: true
                  }
                },
                {
                  locked: {
                    exists: false
                  }
                },
                {
                  authority: {
                    exists: false
                  }
                },
                {
                  and: [
                    {
                      locked: {
                        equals: true
                      }
                    },
                    {
                      authority: {
                        less_than: 1
                      }
                    }
                  ]
                }
              ]
            }
          ]
        };
      }
      const authorized =
        (user?.role && roleToAuthority(user.role as RP_Roles)) || 0;
      const finalRead: Where & { or: Where[] } = {
        or: [
          {
            and: [
              {
                _status: {
                  equals: "published"
                }
              },

              {
                or: [
                  {
                    locked: {
                      not_equals: true
                    }
                  },
                  {
                    locked: {
                      exists: false
                    }
                  },
                  {
                    authority: {
                      exists: false
                    }
                  },
                  {
                    and: [
                      {
                        locked: {
                          equals: true
                        }
                      },
                      {
                        or: [
                          {
                            authority: {
                              less_than: authorized + 1
                            }
                          },
                          {
                            allowList: {
                              contains: user?.id
                            }
                          }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };
      return finalRead;
    };
  } else {
    const d = isDraftsEnabled({ collection: args.collection });
    return (args: AccessArgs): AccessResult => {
      const { req } = args;
      const { user } = req;
      if (user?.role === "admin") return true;
      if (user?.role === "editor") {
        return true;
      }
      const authorized =
        (user?.role && roleToAuthority(user.role as RP_Roles)) || 0;

      const defaultAnd: NonNullable<Where["and"]> = [
        {
          or: [
            {
              locked: {
                exists: false
              }
            },
            {
              locked: {
                not_equals: true
              }
            },
            {
              and: [
                {
                  locked: {
                    equals: true
                  }
                },
                {
                  or: [
                    {
                      allowList: {
                        contains: user?.id
                      }
                    },
                    {
                      authority: {
                        less_than_equal: authorized
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ];
      if (d) {
        defaultAnd.push({
          _status: {
            equals: "published"
          }
        });
      }
      const finalRead: Where & { and: Where[] } = {
        and: [...defaultAnd]
      };
      return finalRead;
    };
  }
};
const standardLockedReadAccess = (args: {
  slug: CollectionSlug;
  collection: CollectionConfig;
}): Access => {
  const { slug, collection } = args;
  const d = isDraftsEnabled({ collection });
  const defaultReadAndNoUser: Where = {
    locked: {
      not_equals: true
    }
  };

  const finalReadAndNoUser = d
    ? {
        and: [
          defaultReadAndNoUser,
          {
            _status: {
              equals: "published"
            }
          }
        ]
      }
    : defaultReadAndNoUser;
  const defaultLockedReadUser: Where[] = [
    {
      locked: {
        not_equals: true
      }
    },
    {
      locked: {
        exists: false
      }
    }
  ];

  return d
    ? (args: AccessArgs): AccessResult => {
        const { req } = args;
        const { user } = req;
        if (!user) return finalReadAndNoUser;

        if (user?.role === "admin") return true;
        if (user?.role === "editor") {
          return true;
        }
        const authorized =
          (user?.role && roleToAuthority(user.role as RP_Roles)) || 0;
        const userAuthorized: { or: Where[] } = {
          or: [
            ...defaultLockedReadUser,
            {
              authority: {
                less_than: authorized + 1
              }
            }
          ]
        };

        const reader: Where & { and: Where[] } = {
          and: [
            {
              locked: {
                equals: true
              }
            },
            {
              allowList: {
                contains: user?.id
              }
            }
          ]
        };

        const finalScenario: Where & { or: Where[] } = {
          or: [
            reader,
            {
              and: [
                {
                  _status: {
                    equals: "published"
                  }
                },
                userAuthorized
              ]
            }
          ]
        };
        if (user?.role === "author") {
          finalScenario.or.push({
            author: {
              equals: user?.id
            }
          });
        }
        return finalScenario;
      }
    : (args: AccessArgs): AccessResult => {
        const { req } = args;
        const { user } = req;
        if (!user) return finalReadAndNoUser;

        if (user?.role === "admin") return true;
        if (user?.role === "editor") {
          return true;
        }
        const authorized =
          (user?.role && roleToAuthority(user.role as RP_Roles)) || 0;
        const userAuthorized: { or: Where[] } = {
          or: [
            ...defaultLockedReadUser,
            {
              authority: {
                less_than: authorized + 1
              }
            }
          ]
        };

        const reader: Where & { and: Where[] } = {
          and: [
            {
              locked: {
                equals: true
              }
            },
            {
              allowList: {
                contains: user?.id
              }
            }
          ]
        };

        const finalScenario: Where & { or: Where[] } = {
          or: [reader, userAuthorized]
        };
        if (user?.role === "author") {
          finalScenario.or.push({
            author: {
              equals: user?.id
            }
          });
        }
        return finalScenario;
      };
};
const lockedReadAccess = (args: { collection: CollectionConfig }): Access => {
  const { collection } = args;
  const hasAuthor = collection.fields.some(
    (r) => "name" in r && r.name === "author"
  );
  if (hasAuthor) {
    return standardLockedReadAccess({
      slug: collection.slug as CollectionSlug,
      collection
    });
  } else {
    return authorlessLockedReadAccess({
      slug: collection.slug as CollectionSlug,
      collection
    });
  }
};
const surrogateMap = {
  richText: {
    root: {
      children: [],
      direction: "ltr" as const,
      type: "root",
      indent: 0,
      format: "left" as const,
      version: 0
    }
  },
  text: "",
  number: 0,
  array: []
};
const authorityChecker = (
  collectionConfig: CollectionConfig<LockedCollections>
) => {
  const collection = collectionConfig.slug as LockedCollections;
  const { fields } = collectionConfig;
  const hasAuthorField = fields.some((f) => {
    return "name" in f && f.name === "author";
  });
  type CheckerParams = {
    user:
      | (User & {
          collection: "users";
        })
      | (Admin & {
          collection: "admins";
        })
      | null;
    doc: DataFromCollectionSlug<typeof collection>;
    auth: number;
  };
  const defaultChecker = ({ user, doc, auth }: CheckerParams) =>
    Boolean(
      user &&
      user.id &&
      user.role &&
      (roleToAuthority(user.role as RP_Roles) >= auth ||
        doc.allowList?.some(
          (r) => `${typeof r === "string" ? r : r.id}` === user.id
        ))
    );
  const authorChecker = (args: CheckerParams) => {
    const { user, doc } = args;
    let base = defaultChecker(args);
    if ("author" in doc) {
      const autho = doc.author;
      const author = Array.isArray(autho) ? autho : [autho];
      base =
        base ||
        author.some((a) => (typeof a === "string" ? a : a.id) === user?.id);
    }
    return base;
  };
  return hasAuthorField ? authorChecker : defaultChecker;
};

const disallowRead = (collection: LockedCollections) => {
  switch (collection) {
    case "surf":
    case "posts":
      return {
        content: surrogateMap.richText satisfies SerializedEditorState,
        title: surrogateMap.text
      };
    case "media":
    case "assets":
    case "userMedia":
      return {
        thumbnailURL: surrogateMap.text,
        url: surrogateMap.text,
        blurDataUrl: surrogateMap.text,
        mimeType: surrogateMap.text,
        darkmode: true
      };
    case "tracks":
      return {
        url: surrogateMap.text,
        mimeType: surrogateMap.text
      };
    case "playlists":
      return {
        tracks: surrogateMap.array,
        description: surrogateMap.text
      };
    case "albums":
      return {
        title: surrogateMap.text,
        description: surrogateMap.text
      };
    case "profile":
      return {
        slides: surrogateMap.array
      };
    default:
      return {};
  }
};
type StateSlug = KeysOfValue<
  Pick<CollectionMap, LockedCollections>,
  {
    _status?: "published" | "draft" | null;
    slug: string;
  }
>;
type State = CollectionMap[StateSlug];
const createRevalidateDoc = <T extends StateSlug>(
  collection: T,
  config: CollectionConfig<T>
): CollectionAfterChangeHook<DataFromCollectionSlug<T>> | null => {
  const v = config.versions;
  let hasStatus = false;
  if (v) {
    if (typeof v !== "boolean") {
      if (v.drafts) {
        const d = v.drafts;
        if (d) {
          hasStatus = true;
        }
      }
    }
  }
  if (!hasStatus) return null;
  const hasSlug = config.fields.some((r) => "name" in r && r.name === "slug");

  if (!hasSlug && collection !== "profile") {
    return null;
  }
  const aa: CollectionAfterChangeHook<State> = ({
    doc: doco,
    previousDoc,
    req: { payload, context },
    operation
  }) => {
    const doc = doco;
    const prv = previousDoc;
    if (!context.disableRevalidate && operation === "update") {
      if (doc._status === "published") {
        let changed = doc._status !== prv._status;
        changed = changed || doc.slug !== prv.slug;
        changed = changed || doc.locked !== prv.locked;
        if (doc.locked && prv.locked) {
          const nowAllowlist = doc.allowList || null;
          const prevAllowlist = prv.allowList || null;
          if (nowAllowlist) {
            if (prevAllowlist) {
              changed =
                changed || !arraysEqualContents(nowAllowlist, prevAllowlist);
            } else {
              changed = true;
            }
          }
          const nowAuth = doc.authority || 1;
          const prevAuth = prv.authority || 1;
          changed = changed || nowAuth !== prevAuth;
        }
        if (changed) {
          const path = `/${collection}/${doc.slug}`;

          payload.logger.info(`Revalidating ${collection} at path: ${path}`);

          revalidatePath(path);

          // revalidateTag(`${collection}-sitemap`, {expire: 50});
        }
      }

      // If the post was previously published, we need to revalidate the old path
      if (prv._status === "published" && doc._status !== "published") {
        const oldPath = `/${collection}/${prv.slug}`;

        payload.logger.info(
          `Revalidating old ${collection} at path: ${oldPath}`
        );

        // revalidatePath(oldPath);
        // revalidateTag(`${collection}-sitemap`, {expire: 50});
      }
    }
    return doc;
  };
  if (collection === "profile") {
    return async ({ req, doc: doco, previousDoc }) => {
      const collectionSlug = "users";
      const doc = doco as Profile;
      const prv = previousDoc as Profile;
      const { context } = req;
      const authorId = (doc as Profile).author as string;
      const authorSlug = await req.payload
        .findByID({
          collection: "users",
          id: authorId,
          select: {
            slug: true
          }
        })
        .then((r) => r.slug)
        .catch(() => null);
      if (!authorSlug) {
        return doc;
      }
      const slug = `${authorSlug}`;
      if (!context.disableRevalidate) {
        if (doc._status === "published") {
          let changed = doc._status !== prv._status;

          changed = changed || doc.locked !== prv.locked;
          if (doc.locked && prv.locked) {
            const nowAllowlist = doc.allowList || null;
            const prevAllowlist = prv.allowList || null;
            if (nowAllowlist) {
              if (prevAllowlist) {
                changed =
                  changed || !arraysEqualContents(nowAllowlist, prevAllowlist);
              } else {
                changed = true;
              }
            }
            const nowAuth = doc.authority || 1;
            const prevAuth = prv.authority || 1;
            changed = changed || nowAuth !== prevAuth;
          }
          if (changed) {
            const path = `/${collectionSlug}/${slug}`;

            req.payload.logger.info(
              `Revalidating ${collection} at path: ${path}`
            );

            // revalidatePath(path);

            // revalidateTag(`users-sitemap`, {expire: 50});
          }
        }
      }
      return doc;
    };
  } else {
    return aa;
  }
};

export const lockCollections = (
  collections: CollectionConfig[],
  pluginOptions: LockerPluginConfig
): void => {
  const collectionConfigs = [...(collections || [])];
  // Get or create users collection
  const targetCollectionSlugs = [...(pluginOptions.targetCollections || [])];

  if (!targetCollectionSlugs.some((slug) => slug === "pages")) {
    targetCollectionSlugs.push("pages");
  }

  targetCollectionSlugs.forEach((slug) => {
    const collection = collectionConfigs?.find((c) => c.slug === slug);
    if (collection) {
      collection.forceSelect = {
        ...collection.forceSelect,
        locked: true,
        allowList: true,
        authority: true
      };
      const { mergedFields, restFields } = mergeFields({
        path: collection.slug,
        baseFields: [
          lockBoxField({
            collection: collection.slug as CollectionSlug
          }),
          allowListField({
            collection: collection.slug as CollectionSlug
          }),
          authorityField({
            collection: collection.slug as CollectionSlug
          })
        ],
        patchFields: collection.fields
      });
      collection.fields = [...restFields, ...mergedFields];
      const collectionSlug = collection.slug as LockedCollections;
      const redacter = disallowRead(collectionSlug);
      const checker = authorityChecker(collection);
      const redactRead: CollectionAfterReadHook<
        DataFromCollectionSlug<typeof collectionSlug>
      > = async ({ doc, req }) => {
        const user = req.user;
        if (doc.locked) {
          //We consider the default value to be 1, representing an authenticated user; otherwise locked is usesless as a property
          const auth = doc.authority ?? 1;
          const hasAccess = checker({ user, doc, auth });
          if (hasAccess) {
            return doc;
          } else {
            Object.keys(redacter).forEach((key) => {
              delete doc[key as keyof typeof doc];
            });
            return {
              ...doc,
              ...redacter,
              disabled: true
            };
          }
        }
        return {
          ...doc,
          locked: false,
          authority: 0,
          allowList: [],
          disabled: false
        };
      };
      const aft = [...(collection.hooks?.afterChange || [])] as Array<
        CollectionAfterChangeHook<DataFromCollectionSlug<typeof slug>>
      >;
      const llectionhooks = {
        ...collection.hooks,
        afterRead: [...(collection.hooks?.afterRead || []), redactRead],
        afterChange: [...(collection.hooks?.afterChange || [])]
      };
      if (isDraftsEnabled({ collection })) {
        const ach = createRevalidateDoc(collectionSlug, { ...collection });
        ach && aft.push(ach);
      }
      llectionhooks.afterChange = aft;
      collection.hooks = { ...llectionhooks };
    }
  });
};
