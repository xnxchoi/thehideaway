import { isAdminWithRoles } from "../utils/payload-access";
import {
  baseSlugs,
  defaults
} from "@payload-auth/better-auth/plugin/constants";
import type { CollectionConfig } from "payload";
import type { PayloadAuthOptions } from "@payload-auth/better-auth/plugin/types";

export function buildAdminInvitationsCollection({
  incomingCollections,
  pluginOptions
}: {
  incomingCollections: CollectionConfig[];
  pluginOptions: PayloadAuthOptions;
}): CollectionConfig {
  const adminInvitationSlug =
    pluginOptions.adminInvitations?.slug ?? baseSlugs.adminInvitations;
  const adminRoles = pluginOptions.users?.adminRoles ?? [defaults.adminRole];
  const roles = pluginOptions.users?.roles ?? [defaults.userRole];
  const allRoleOptions = [...new Set([...adminRoles, ...roles])].map(
    (role) => ({
      label: role
        .split(/[-_\s]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      value: role
    })
  );
  const existingAdminInvitationCollection = incomingCollections.find(
    (collection) => collection.slug === adminInvitationSlug
  ) as CollectionConfig | undefined;

  let adminInvitationsCollection: CollectionConfig = {
    ...existingAdminInvitationCollection,
    slug: adminInvitationSlug,
    admin: {
      defaultColumns: ["email", "role", "expiresAt"],
      useAsTitle: "email",
      group: pluginOptions?.collectionAdminGroup ?? "Auth",
      hidden: pluginOptions.adminInvitations?.hidden,
      ...existingAdminInvitationCollection?.admin
    },
    access: {
      create: isAdminWithRoles({ adminRoles }),
      read: isAdminWithRoles({ adminRoles }),
      delete: isAdminWithRoles({ adminRoles }),
      update: isAdminWithRoles({ adminRoles }),
      ...(existingAdminInvitationCollection?.access ?? {})
    },
    timestamps: true,
    fields: [
      {
        label: "Role",
        name: "role",
        type: "select",
        options: allRoleOptions,
        required: true,
        defaultValue:
          pluginOptions.users?.defaultAdminRole ?? defaults.adminRole
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        index: true,
        required: true
      },
      {
        name: "token",
        label: "Token hash",
        index: true,
        type: "text",
        access: {
          read: () => false
        },
        admin: {
          hidden: true,
          readOnly: true
        },
        required: true
      },
      {
        name: "expiresAt",
        label: "Expires at",
        type: "date",
        index: true,
        required: true,
        admin: { readOnly: true }
      }
    ]
  };

  if (pluginOptions.adminInvitations?.collectionOverrides) {
    adminInvitationsCollection =
      pluginOptions.adminInvitations.collectionOverrides({
        collection: adminInvitationsCollection
      });
  }

  return adminInvitationsCollection;
}
