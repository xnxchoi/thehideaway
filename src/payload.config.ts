import { afterSchemaInit } from "@/lib/scripts/afterSchemaInit";
import { collections } from "@/payload/collections";
import { Admins } from "@/payload/collections/Admins";
import { DeferredEmails } from "@/payload/collections/DeferredEmails";
import { EmailQuota } from "@/payload/collections/EmailQuota";
import { Footer } from "@/payload/collections/Footer/config";
import { Header } from "@/payload/collections/Header";
import { createProfile } from "@/payload/collections/Profile/operations/createProfile";
import { createN } from "@/payload/collections/Users/hooks/afterChange";
import { defaultLexical } from "@/payload/Lexical/defaultLexical";
import { plugins } from "@/payload/plugins";
import { User } from "@payload-types";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { nanoid } from "nanoid";
import path from "path";
import { buildConfig, PayloadRequest } from "payload";
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
      collections: ["posts", "pages", "profile"],
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
    migrationDir: path.resolve(dirname, "lib/migrations"),
    pool: {
      max: 350,
      connectionString: process.env.DATABASE_URI
    },
    idType: "uuid",
    allowIDOnCreate: false,
    afterSchemaInit: [afterSchemaInit]
  }),
  collections: [...collections, Admins, EmailQuota, DeferredEmails],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
  onInit: async (payload) => {
    payload.logger.info("Initializing Payload...");
    const tags: [string, string][] = [
      ["Life", "life"],
      ["Startup", "startup"],
      ["Blockchain", "blockchain"],
      ["Poetry", "poetry"],
      ["Life Lessons", "lifeLessons"],
      ["Politics", "politics"],
      ["Health", "health"],
      ["Love", "love"],
      ["Travel", "travel"],
      ["Technology", "technology"],
      ["Entrepreneurship", "entrepreneurship"],
      ["Self Improvement", "selfImprovement"],
      ["Education", "education"],
      ["Writing", "writing"],
      ["Business", "business"],
      ["Cryptocurrency", "cryptocurrency"],
      ["Bitcoin", "bitcoin"],
      ["Design", "design"],
      ["Social Media", "socialMedia"],
      ["Music", "music"],
      ["Relationships", "relationships"],
      ["Sports", "sports"]
    ];
    const uid = await payload
      .find({
        collection: "users",
        where: {
          and: [
            {
              role: {
                equals: "admin"
              }
            },
            {
              name: {
                equals: "concierge"
              }
            }
          ]
        },
        overrideAccess: true,
        select: {
          slug: true
        },
        pagination: false,
        limit: 1
      })
      .then(async ({ docs }) => {
        if (!docs[0]) {
          return await payload
            .create({
              collection: "users",
              draft: false,
              data: {
                name: "concierge",
                role: "admin",
                slug: "concierge",
                email: "sean.sungyoon.choi@gmail.com",
                username: "concierge",
                emailVerified: true,
                verified: true,
                firstName: "The",
                lastName: "Concierge",
                onboarded: true,
                banned: false,
                twoFactorEnabled: false
              }
            })
            .then(({ id }) => id);
        } else {
          return (docs[0] as User).id;
        }
      })
      .catch((e) => {
        payload.logger.error("Error creating user concierge:", e);
      });
    if (typeof uid === "string") {
      // await syncTrackMedia(payload, uid).catch((e) => {
      //   payload.logger.error("syncTrackMedia failed:", e);
      // });

      const pr = tags.map(([title, slug]) =>
        payload
          .count({
            collection: "tags",
            overrideAccess: true,
            where: {
              title: {
                equals: title
              }
            }
          })
          .then((r) =>
            r.totalDocs < 1 ? ([title, slug] as [string, string]) : slug
          )
          .catch((e) =>
            payload.logger.error(
              "Error while querying for unitinialized tag " + slug + ": ",
              e
            )
          )
      );
      const results = await Promise.allSettled(pr);
      const notErrored = results.filter((v) => v.status === "fulfilled");
      const errored = results.filter((r) => r.status === "rejected");
      const left = notErrored
        .map((rx) => rx.value)
        .filter((t) => Array.isArray(t));
      if (left.length > 0) {
        const over = left.map(([title, slug]) =>
          payload
            .create({
              collection: "tags",
              draft: false,
              overrideAccess: true,
              data: {
                title,
                slug,
                hashId: nanoid(11),
                slugLock: true,
                tagCount: 0,
                author: uid
              }
            })
            .then((r) => r.slug)
        );
        await Promise.allSettled(over)
          .then((r) => r.filter((x) => x.status === "fulfilled"))
          .then((g) => g.map((xx) => xx.value))
          .then((s) => console.log("Tags created:", s));
      }
    } else {
      payload.logger.error("Error in locating admin user with name concierge");
    }
    await payload
      .count({
        collection: "categories",
        overrideAccess: true,
        where: {
          slug: { equals: "uncategorized" }
        }
      })
      .then(async ({ totalDocs }) => {
        if (totalDocs === 0) {
          await payload.create({
            collection: "categories",
            draft: false,
            overrideAccess: true,
            data: {
              popularity: 0,
              title: "Uncategorized",
              slug: "uncategorized",
              description:
                "Default bucket for all reflections without a category.",
              relatedCategories: []
            }
          });
        }
      })
      .catch((error) => {
        payload.logger.error("Error creating uncategorized category:", error);
      });
  },
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
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true;

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get("authorization");
        return authHeader === `Bearer ${process.env.CRON_SECRET}`;
      }
    },
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
      }
    ],
    autoRun: [
      {
        cron: "*/15 * * * *", // every 15 minutes
        limit: 100, // limit jobs to process each run
        queue: "quarterHour" // name of the queue
      }
      // add as many cron jobs as you want
    ]
  },
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts")
  },
  routes: {
    admin: "/vault"
  }
});
