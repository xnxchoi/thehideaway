import { User } from "@/payload-types";
import { CollectionConfig, PayloadRequest } from "payload";
import { createNotification } from "../Notifications/hooks/createNotification";
import { hideIfNotAdmin } from "../helpers";

export const Follows: CollectionConfig = {
  slug: "follows",
  lockDocuments: false,

  admin: {
    useAsTitle: "id",
    hidden: hideIfNotAdmin
  },
  defaultPopulate: {
    user: true,
    target: true
  },
  defaultSort: "-createdAt",
  access: {
    read: ({ req }) => {
      return true;
    }
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      hasMany: false,
      required: true,
      maxDepth: 0,
      index: true,
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    },
    {
      name: "target",
      type: "relationship",
      relationTo: "users",
      required: true,
      hasMany: false,
      index: true,
      maxDepth: 0,
      filterOptions: ({ req, data }) => {
        if (!req.user) {
          return false;
        }
        return {
          id: {
            not_equals: req.user.id
          }
        };
      },
      access: {
        read: () => true,
        create: () => true,
        update: () => false
      }
    }
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (!req.user) {
          return;
        }
        if (data.target === req.user.id) {
          return new Error("You cannot follow yourself");
        }
        if (operation === "create") {
          const followExists = await req.payload
            .count({
              collection: "follows",
              where: {
                and: [
                  {
                    target: {
                      equals: data.target
                    }
                  },
                  {
                    user: {
                      equals: data.user
                    }
                  }
                ]
              }
            })
            .then((count) => {
              return count.totalDocs > 0;
            })
            .catch((err) => {
              console.error(err);
              return false;
            });
          if (!followExists) {
            return data;
          }
        }
        if (operation === "update") {
          return originalDoc;
        }
      }
    ],
    afterChange: [
      async ({ data, doc, req, operation, previousDoc }) => {
        if (operation === "create") {
          try {
            const user = doc.target as User["id"];
            const follower = doc.user as User["id"];
            const followerDoc = await req.payload.findByID({
              req,
              collection: "users",
              id: follower,
              select: {
                slug: true,
                name: true
              }
            });
            await createNotification(
              {
                recipient: user,
                title: `${followerDoc.name} followed you`,
                content: `${followerDoc.name} has followed your profile`,
                trigger: {
                  relationTo: "users",
                  value: follower
                },
                type: "follow",
                importance: 1,
                actionLink: {
                  type: "custom",
                  newTab: false,
                  label: `Visit ${followerDoc.name}'s profile`,
                  url: `/@${followerDoc.slug}`
                },
                sticky: false
              },
              req as PayloadRequest & {
                transactionID: string | number | Promise<string | number>;
              }
            );
            return doc;
          } catch (e) {
            const additionalMsg = e instanceof Error ? ": " + e.message : "";
            req.payload.logger.error(
              e,
              `Error creating notification for follow ${doc.id}` + additionalMsg
            );
            console.error({
              message:
                `Error creating notification for follow ${doc.id}` +
                additionalMsg,
              error: e
            });
            return doc;
          }
        }
        return doc;
      }
    ]
  }
};
