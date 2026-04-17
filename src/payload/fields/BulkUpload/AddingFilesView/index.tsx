"use client";

import { ActionsBar } from "@/payload/fields/BulkUpload/ActionsBar";
import {
  discardBulkUploadModalSlug,
  DiscardWithoutSaving
} from "@/payload/fields/BulkUpload/DiscardWithoutSaving";
import { EditForm } from "@/payload/fields/BulkUpload/EditForm";
import { FileSidebar } from "@/payload/fields/BulkUpload/FileSidebar";
import { DrawerHeader } from "@/payload/fields/BulkUpload/Header";
import { User } from "@payload-types";
import { getTranslation } from "@payloadcms/translations";
import {
  DocumentInfoProvider,
  useAuth,
  useConfig,
  useModal,
  useTranslation
} from "@payloadcms/ui";
import "./index.scss";
import { useFormsManager } from "@/payload/fields/BulkUpload/FormsManager";
import { CollectionSlug } from "payload";
import { reduceFieldsToValues } from "payload/shared";

const baseClass = "bulk-upload--file-manager";

export function AddingFilesView() {
  const {
    activeIndex,
    collectionSlug,
    docPermissions,
    documentSlots,
    forms,
    hasPublishPermission,
    hasSavePermission,
    hasSubmitted,
    resetUploadEdits,
    updateUploadEdits
  } = useFormsManager();
  const activeForm = forms[activeIndex];
  const { getEntityConfig } = useConfig();
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const { openModal } = useModal();

  const collectionConfig = getEntityConfig({ collectionSlug });

  return (
    <div className={baseClass}>
      <FileSidebar />

      <div className={`${baseClass}__editView`}>
        <DrawerHeader
          onClose={() => openModal(discardBulkUploadModalSlug)}
          title={getTranslation(collectionConfig.labels.singular, i18n)}
        />
        {activeForm ? (
          <DocumentInfoProvider
            collectionSlug={collectionSlug! as CollectionSlug}
            currentEditor={user! as User}
            docPermissions={docPermissions}
            hasPublishedDoc={false}
            hasPublishPermission={hasPublishPermission}
            hasSavePermission={hasSavePermission}
            id={null!}
            initialData={reduceFieldsToValues(activeForm.formState, true)}
            initialState={activeForm.formState}
            isLocked={false}
            key={`${activeIndex}-${forms.length}`}
            lastUpdateTime={0}
            mostRecentVersionIsAutosaved={false}
            unpublishedVersionCount={0}
            Upload={documentSlots.Upload}
            versionCount={0}
          >
            <ActionsBar collectionConfig={collectionConfig} />
            <EditForm
              resetUploadEdits={resetUploadEdits}
              submitted={hasSubmitted}
              updateUploadEdits={updateUploadEdits}
              uploadEdits={activeForm?.uploadEdits}
            />
          </DocumentInfoProvider>
        ) : null}
      </div>

      <DiscardWithoutSaving />
    </div>
  );
}
