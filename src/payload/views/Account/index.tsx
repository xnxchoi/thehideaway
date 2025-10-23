import type {
  AdminViewServerProps,
  CollectionSlug,
  DocumentViewServerPropsOnly
} from "payload";
import { AccountViewClient } from "./index.client";
import type { AuthCollectionSlug } from "node_modules/@payloadcms/sdk/dist/types";
import type { Config } from "@/payload-types";
import { getDocumentData } from "node_modules/@payloadcms/next/dist/views/Document/getDocumentData";
import { getDocumentPermissions } from "node_modules/@payloadcms/next/dist/views/Document/getDocumentPermissions";
import { getIsLocked } from "node_modules/@payloadcms/next/dist/views/Document/getIsLocked";
import { getVersions } from "node_modules/@payloadcms/next/dist/views/Document/getVersions";
import { getDocPreferences } from "node_modules/@payloadcms/next/dist/views/Document/getDocPreferences";
import { buildFormState } from "@payloadcms/ui/utilities/buildFormState";
import { AccountClient } from "node_modules/@payloadcms/next/dist/views/Account/index.client";
import {
  DocumentInfoProvider,
  EditDepthProvider,
  HydrateAuthProvider
} from "@payloadcms/ui";
import { notFound } from "next/navigation";
import { DocumentHeader } from "@payloadcms/next/rsc";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import { EditView } from "../Edit";
import type { FC } from "react";
import { DateTime } from "luxon";
import { DefaultEditView } from "../Edit/index.client";
export const AccountView = async ({
  initPageResult,
  searchParams,
  params
}: AdminViewServerProps) => {
  const {
    languageOptions,
    locale,
    permissions,
    req,
    req: {
      i18n,
      payload,
      payload: { config },
      user
    }
  } = initPageResult;

  const {
    admin: { theme, user: t },
    routes: { api },
    serverURL
  } = config;
  const userSlug = t as CollectionSlug;
  const collectionConfig = payload?.collections?.[userSlug]?.config;

  if (collectionConfig && user?.id) {
    // Fetch the data required for the view
    const data = await getDocumentData({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      locale,
      payload,
      req,
      user
    });

    if (!data) {
      throw new Error("not-found");
    }

    // Get document preferences
    const docPreferences = await getDocPreferences({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      payload,
      user
    });

    // Get permissions
    const { docPermissions, hasPublishPermission, hasSavePermission } =
      await getDocumentPermissions({
        id: user.id,
        collectionConfig,
        data,
        req
      });

    // Build initial form state from data
    const { state: formState } = await buildFormState({
      id: user.id,
      collectionSlug: collectionConfig.slug,
      data,
      docPermissions,
      docPreferences,
      locale: locale?.code,
      operation: "update",
      renderAllFields: true,
      req,
      schemaPath: collectionConfig.slug,
      skipValidation: true
    });

    // Fetch document lock state
    const { currentEditor, isLocked, lastUpdateTime } = await getIsLocked({
      id: user.id,
      collectionConfig,
      isEditing: true,
      req
    });

    // Get all versions required for UI
    const {
      hasPublishedDoc,
      mostRecentVersionIsAutosaved,
      unpublishedVersionCount,
      versionCount
    } = await getVersions({
      id: user.id,
      collectionConfig,
      doc: data,
      docPermissions,
      locale: locale?.code,
      payload,
      user
    });
    return (
      <DocumentInfoProvider
        apiURL={`${serverURL}${api}/${userSlug}${user?.id ? `/${user.id}` : ""}`}
        collectionSlug={userSlug}
        currentEditor={currentEditor!}
        docPermissions={docPermissions}
        hasPublishedDoc={hasPublishedDoc}
        hasPublishPermission={hasPublishPermission}
        hasSavePermission={hasSavePermission}
        id={user?.id}
        initialData={data}
        initialState={formState}
        isEditing
        isLocked={isLocked}
        lastUpdateTime={lastUpdateTime || DateTime.now().toMillis()}
        mostRecentVersionIsAutosaved={mostRecentVersionIsAutosaved}
        unpublishedVersionCount={unpublishedVersionCount}
        versionCount={versionCount}
      >
        <EditDepthProvider>
          <DocumentHeader
            collectionConfig={collectionConfig}
            hideTabs
            permissions={permissions}
            req={req}
          />
          <HydrateAuthProvider permissions={permissions} />
          {RenderServerComponent({
            Component: config.admin?.components?.views?.account?.Component,
            Fallback: DefaultEditView as FC<{}>,
            importMap: payload.importMap,
            serverProps: {
              doc: data,
              hasPublishedDoc,
              i18n,
              initPageResult,
              locale,
              params,
              payload,
              permissions,
              routeSegments: [],
              searchParams,
              user
            } satisfies DocumentViewServerPropsOnly
          })}
          <AccountClient />
        </EditDepthProvider>
      </DocumentInfoProvider>
    );
  }

  return notFound();
};
