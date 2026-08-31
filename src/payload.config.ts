// Side-effect import: validates required env vars on app boot. Throws in
// production when something is missing/malformed; warns in dev.
import "@/lib/env";
import { seedButler } from "@/lib/auth/dev/seedButler";
import { ensureUncategorized } from "@/seed/initial";
import {
  seedReaders,
  warnIfFixtureUsersInProd
} from "@/lib/auth/dev/seedReaders";
import { collections } from "@/payload/collections";
import { Admins } from "@/payload/collections/Admins";
import { DeferredEmails } from "@/payload/collections/DeferredEmails";
import { EmailQuota } from "@/payload/collections/EmailQuota";
import { createProfile } from "@/payload/collections/Profile/operations/createProfile";
import { createN } from "@/payload/collections/Users/hooks/afterChange";
import { Footer } from "@/payload/globals/Footer/config";
import { Header } from "@/payload/globals/Header";
import { defaultLexical } from "@/payload/Lexical/defaultLexical";
import { plugins } from "@/payload/plugins";
import { payloadJobsAccess } from "@/payload/jobs/access";
import { calculateSearchScore } from "@/payload/search/calculateScore";
import { afterSchemaInit } from "@/scripts/afterSchemaInit";
import { postgresAdapter } from "@payloadcms/db-postgres";
// nanoid was used by the inline tag-seed block that lived in onInit;
// the seed now lives in `src/seed/initial.ts`. The commented-out
// legacy snippet below still references `nanoid` — left as historical
// context only; safe to remove once that block is deleted.
import path from "path";
import { buildConfig } from "payload";
import sharp from "sharp";
import { fileURLToPath } from "url";
import { uuidv7 } from "uuidv7";
import { getServerSideURL } from "./utilities/getURL";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  localization: { defaultLocale: "en", locales: ["en", "ko"], fallback: true },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    routes: {
      browseByFolder: "/vault/folio"
    },
    components: {
      providers: ["@/payload/providers/Admins/index.tsx"],
      graphics: {
        Logo: "@/graphics/Logo/index.tsx#Logo",
        Icon: "@/graphics/Icon/index.tsx#Icon"
      },
      afterNavLinks: ["@/payload/elements/LogOut/index.tsx#LogoutButton"],
      actions: ["@/payload/components/Actions/index.tsx"],
      views: {
        dashboard: {
          Component: "@/payload/views/Dashboard/index.tsx#DefaultDashboard"
        }
        // account: {
        //   Component: "@/payload/views/Edit/index.client.tsx#DefaultEditView"
        // }
      }
    },
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname)
    },
    livePreview: {
      collections: ["posts", "surf", "pages", "profile"],
      breakpoints: [
        {
          label: "Mobile",
          name: "mobile",
          width: 375,
          height: 667
        },
        {
          label: "Tablet",
          name: "tablet",
          width: 768,
          height: 1024
        },
        {
          label: "Desktop",
          name: "desktop",
          width: 1440,
          height: 900
        }
      ]
    },
    meta: {
      title: "PRIVATE AREA",
      titleSuffix: "- The Hideaway",
      icons: [
        {
          type: "image/png",
          rel: "icon",
          url: "/assets/favicon.svg"
        }
      ]
    }
  }, // This config helps us configure global or default features that the other editors can inherit

  editor: defaultLexical,
  db: postgresAdapter({
    push: false,
    migrationDir: path.resolve(dirname, "lib/migrations-baseline"),
    pool: {
      max: 15,
      connectionString: process.env.DATABASE_URI
    },
    idType: "uuid",
    // Normally id-on-create is rejected — clients shouldn't pick their
    // own UUIDs. The seed-rebuild generator needs to pre-generate UUIDs
    // so parent-child relationships in the captured INSERTs reference
    // resolvable IDs (otherwise the regenerated migration uses
    // `id=default` for the parent and a stale captured UUID for the
    // FK, which collapses on the next migrate:fresh).
    allowIDOnCreate: process.env.SEED_CAPTURE === "1",
    afterSchemaInit: [afterSchemaInit],
    // When SEED_CAPTURE=1, install a Drizzle logger that pushes every
    // INSERT into a process-global buffer. The `pnpm seed:rebuild`
    // generator reads that buffer after running `runInitialSeed` and
    // emits the captured SQL into a migration file. Off in every other
    // context. See `src/scripts/seedToMigration.ts`.
    logger:
      process.env.SEED_CAPTURE === "1"
        ? {
            logQuery: (query: string, params: unknown[]) => {
              const buf = (
                globalThis as unknown as {
                  __SEED_CAPTURE__?: Array<{
                    query: string;
                    params: unknown[];
                  }>;
                }
              ).__SEED_CAPTURE__;
              if (buf) buf.push({ query, params });
            }
          }
        : false
  }),
  collections: [...collections, Admins],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  onInit: async (payload) => {
    payload.logger.info("Initializing Payload...");

    // Boot-time seeds (concierge admin, "uncategorized" category, default
    // tags, KRW currency, launch Plans/Prices) used to live here as
    // awaited `payload.create()` calls. That pattern deadlocks: Payload
    // is mid-initialization, the slug/handle field hooks call
    // `getPayload()` to validate uniqueness, the call returns the
    // still-initializing instance, and the await never resolves.
    //
    // Seeds now live in `src/seed/initial.ts` (Payload-native source of
    // truth) and ship as a generated SQL migration
    // (`src/lib/migrations/99999999_000000_initial_seed.ts`) regenerated
    // via `pnpm seed:rebuild`. See `readmes/MIGRATIONS.md` § "Seeding
    // mechanics" for the full workflow.
    //
    // Dev-only fixture users (butler, readers) still fire here because
    // they depend on env vars that don't belong in a migration. The
    // `setTimeout(0, …)` shim breaks them out of onInit's call stack so
    // the slug/handle hook receives a fully-initialized payload by the
    // time it fires.
    setTimeout(() => {
      void ensureUncategorized(payload).catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.stack || err.message : String(err);
        payload.logger.error(`[seed] uncategorized failed: ${msg}`);
      });
      void seedButler(payload).catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.stack || err.message : String(err);
        payload.logger.error(`[dev-butler] seed failed: ${msg}`);
      });
      void seedReaders(payload).catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.stack || err.message : String(err);
        payload.logger.error(`[dev-readers] seed failed: ${msg}`);
      });
      // Defence-in-depth: if a prod boot ever finds dev fixture users in
      // the DB, log loudly so ops can manually audit. Both seed functions
      // refuse to run in prod, so finding these users means someone
      // restored a dev dump or env got misconfigured.
      void warnIfFixtureUsersInProd(payload).catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.stack || err.message : String(err);
        payload.logger.error(`[prod-sanity] check failed: ${msg}`);
      });
    }, 0);
  },
  // if (typeof uid === "string") {

  //
  //   const pr = tags.map(([title, slug]) =>
  //     payload
  //       .count({
  //         collection: "tags",
  //         overrideAccess: true,
  //         where: {
  //           title: {
  //             equals: title
  //           }
  //         }
  //       })
  //       .then((r) =>
  //         r.totalDocs < 1 ? ([title, slug] as [string, string]) : slug
  //       )
  //       .catch((e) =>
  //         payload.logger.error(
  //           "Error while querying for unitinialized tag " + slug + ": ",
  //           e
  //         )
  //       )
  //   );
  //   const results = await Promise.allSettled(pr);
  //   const notErrored = results.filter((v) => v.status === "fulfilled");
  //   const errored = results.filter((r) => r.status === "rejected");
  //   const left = notErrored
  //     .map((rx) => rx.value)
  //     .filter((t) => Array.isArray(t));
  //   if (left.length > 0) {
  //     const over = left.map(([title, slug]) =>
  //       payload
  //         .create({
  //           collection: "tags",
  //           draft: false,
  //           overrideAccess: true,
  //           data: {
  //             title,
  //             slug,
  //             hashId: nanoid(11),
  //             slugLock: true,
  //             tagCount: 0,
  //             author: uid
  //           }
  //         })
  //         .then((r) => r.slug)
  //     );
  //     await Promise.allSettled(over)
  //       .then((r) => r.filter((x) => x.status === "fulfilled"))
  //       .then((g) => g.map((xx) => xx.value))
  //       .then((s) => console.log("Tags created:", s));
  //   }
  // } else {
  //   payload.logger.error("Error in locating admin user with name concierge");
  // }
  // },
  plugins,
  bin: [],
  secret: process.env.PAYLOAD_SECRET!,
  sharp: sharp,
  jobs: {
    jobsCollectionOverrides: ({ defaultJobsCollection }) => {
      return {
        ...defaultJobsCollection,
        fields: [
          ...defaultJobsCollection.fields,
          {
            type: "text",
            name: "id",
            defaultValue: () => uuidv7()
          }
        ]
      };
    },
    access: payloadJobsAccess,
    tasks: [
      {
        slug: "welcomeUser",
        label: "Add welcome notification & profile for new user",
        inputSchema: [
          {
            name: "userId",
            type: "text",
            required: true
          }
        ],
        outputSchema: [
          {
            name: "userId",
            type: "text",
            required: true
          },
          {
            name: "slug",
            type: "text",
            required: true
          }
        ],
        handler: async ({ input, req }) => {
          req.payload.logger.info(
            `=== NEW USER WELCOME MESSAGE JOB STARTED ===`
          );
          try {
            const userDoc = await req.payload.findByID({
              collection: "users",
              id: input.userId
            });
            // Step 1: Create Profile
            await createProfile({ req, doc: userDoc });
            // Step 2: Create welcome notification
            await createN({
              user: userDoc,
              req
            });
            await req.payload.update({
              collection: "users",
              where: {
                id: {
                  equals: userDoc.id
                }
              },
              data: {
                ...userDoc,
                onboarded: true
              },
              req,
              context: {
                user: {
                  role: userDoc.role
                },
                overrideAccess: true
              },
              overrideAccess: true
            });
            req.payload.logger.info(`Updated user ${userDoc.slug}`);
            const result = {
              user: { slug: userDoc.slug, userId: userDoc.id }
            };
            req.payload.logger.info(
              `=== USER WELCOME NOTIFICATIONS JOB COMPLETED ===`
            );
            req.payload.logger.info(`Result: ${JSON.stringify(result)}`);

            return { output: result };
          } catch (error) {
            req.payload.logger.error(
              `=== USER WELCOME NOTIFICATIONS JOB ERROR ===`
            );
            req.payload.logger.error(
              `Error in new user welcome: ${(error as Error).message}`
            );
            throw error;
          }
        }
      },
      {
        slug: "welcomeUsers",
        label: "Add welcome notification & profile for all new users",
        outputSchema: [
          {
            name: "users",
            type: "array",
            fields: [
              {
                name: "userId",
                type: "text",
                required: true
              },
              {
                name: "slug",
                type: "text",
                required: true
              }
            ],
            required: true
          }
        ],
        handler: async ({ req }) => {
          req.payload.logger.info(`=== NEW USER BATCH JOB STARTED ===`);
          try {
            const userResults: { userId: string; slug: string }[] = [];
            const users = await req.payload
              .find({
                collection: "users",
                where: {
                  and: [
                    {
                      onboarded: {
                        not_equals: true
                      }
                    },
                    {
                      banned: {
                        not_equals: true
                      }
                    }
                  ]
                },
                req,
                limit: 1000
              })
              .then((r) => r.docs);
            for (const userDoc of users) {
              try {
                // Step 1: Create Profile
                await createProfile({ req, doc: userDoc });
                // Step 2: Create welcome notification
                await createN({
                  user: userDoc,
                  req
                });
                await req.payload.update({
                  collection: "users",
                  where: {
                    id: {
                      equals: userDoc.id
                    }
                  },
                  data: {
                    onboarded: true
                  },
                  req,
                  context: {
                    user: {
                      role: userDoc.role
                    },
                    overrideAccess: true
                  },
                  overrideAccess: true
                });
                req.payload.logger.info(`Updated user ${userDoc.slug}`);
                const result = { slug: userDoc.slug, userId: userDoc.id };
                userResults.push(result);
              } catch (e) {
                req.payload.logger.error(
                  `Error in welcoming user ${userDoc.slug}: ${(e as Error).message}`
                );
              }
            }
            req.payload.logger.info(`=== NEW USER BATCH JOB COMPLETED ===`);
            const result = [...userResults];
            req.payload.logger.info(`Result: ${JSON.stringify(result)}`);
            return { output: result };
          } catch (error) {
            req.payload.logger.error(`=== NEW USER BATCH JOB ERROR ===`);
            req.payload.logger.error(
              `Error in batch updating users: ${(error as Error).message}`
            );
            throw error;
          }
        }
      },
      {
        slug: "refreshSearchScores",
        label: "Recalculate relevance scores for all search index documents",
        outputSchema: [
          {
            name: "processed",
            type: "number",
            required: true
          }
        ],
        handler: async ({ req }) => {
          const { payload } = req;
          const BATCH = 100;
          let page = 1;
          let processed = 0;

          while (true) {
            const { docs, hasNextPage } = await payload.find({
              collection: "search",
              limit: BATCH,
              page,
              depth: 0,
              overrideAccess: true
            });

            for (const doc of docs) {
              const newScore = calculateSearchScore({
                priority: doc.priority,
                createdAt: doc.createdAt,
                hasImage: !!doc.meta?.image,
                hasDescription: !!doc.meta?.description,
                hasTags: Array.isArray(doc.tags) && doc.tags.length > 0,
                hasCategory:
                  Array.isArray(doc.category) && doc.category.length > 0
              });

              if (newScore !== (doc as any).score) {
                await payload.update({
                  collection: "search",
                  id: doc.id,
                  data: { score: newScore } as any,
                  depth: 0,
                  overrideAccess: true
                });
              }
              processed++;
            }

            if (!hasNextPage) break;
            page++;
          }

          payload.logger.info(
            `refreshSearchScores: updated ${processed} search documents`
          );
          return { output: { processed } };
        }
      }
    ],
    workflows: [
      {
        slug: "onboardUsers",
        label: "workflow run regularly to sync newly created users",
        handler: async ({ job, tasks, inlineTask, req }) => {
          await tasks.welcomeUsers("1");
        },
        queue: "halfHour"
      },
      {
        slug: "refreshSearch",
        label: "Daily refresh of search relevance scores",
        handler: async ({ tasks }) => {
          await tasks.refreshSearchScores("1");
        },
        queue: "daily"
      }
    ],
    autoRun: [
      {
        cron: "0 3 * * *", // daily at 03:00 UTC
        limit: 1,
        queue: "daily"
      }
    ]
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  },
  routes: {
    admin: "/vault"
  }
});
