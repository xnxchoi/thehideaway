"use client";

import { DocumentFields } from "@/payload/elements/DocumentFields";
import { Upload_v4 } from "@/payload/elements/Upload";
import { ClientCollectionConfig, JsonObject, TypeWithID } from "payload";
import {
  Fragment,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import type { EditFormProps } from "./types";

import "./index.scss";
import {
  Form,
  FormProps,
  MoveDocToFolder,
  OperationProvider,
  useConfig,
  useDocumentDrawerContext,
  useDocumentEvents,
  useDocumentInfo,
  useForm,
  useServerFunctions,
  WatchChildErrors
} from "@payloadcms/ui";
import { abortAndIgnore, handleAbortRef } from "@payloadcms/ui/shared";
import { useFormsManager } from "../FormsManager";

const baseClass = "collection-edit";

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered

export function EditForm({
  resetUploadEdits,
  submitted,
  updateUploadEdits,
  uploadEdits
}: EditFormProps) {
  const {
    action,
    collectionSlug: docSlug,
    docPermissions,
    getDocPreferences,
    hasSavePermission,
    initialState,
    isInitializing,
    Upload: CustomUpload
  } = useDocumentInfo();

  const { drawerSlug, onSave: onSaveFromContext } = useDocumentDrawerContext();

  const { getFormState } = useServerFunctions();

  const {
    config: { folders },
    getEntityConfig
  } = useConfig();

  const abortOnChangeRef = useRef<AbortController>(null);

  const collectionConfig = getEntityConfig({
    collectionSlug: docSlug
  }) as ClientCollectionConfig;
  const { reportUpdate } = useDocumentEvents();

  const collectionSlug = collectionConfig?.slug;

  const [schemaPath] = useState(collectionSlug);

  const onSave = useCallback(
    (json: JsonObject) => {
      if (!collectionSlug) throw new Error("Collection slug is not defined");
      reportUpdate({
        doc: json?.doc || json?.result,
        drawerSlug,
        entitySlug: collectionSlug,
        operation: "create",
        updatedAt: json?.result?.updatedAt || new Date().toISOString()
      });

      if (
        typeof onSaveFromContext === "function" &&
        !!json &&
        "doc" in json &&
        json.doc &&
        "id" in json.doc &&
        "result" in json
      ) {
        void onSaveFromContext({
          ...(json as JsonObject & { doc: TypeWithID; result: TypeWithID }),
          operation: "create"
        });
      }
      resetUploadEdits?.();
    },
    [
      collectionSlug,
      onSaveFromContext,
      reportUpdate,
      resetUploadEdits,
      drawerSlug
    ]
  );

  const onChange: NonNullable<FormProps["onChange"]>[0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(
        abortOnChangeRef as RefObject<AbortController>
      );

      const docPreferences = await getDocPreferences();

      const { state: newFormState } = await getFormState({
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        operation: "create",
        schemaPath,
        signal: controller.signal,
        skipValidation: !submitted
      });

      abortOnChangeRef.current = null;

      return newFormState!;
    },
    [
      collectionSlug,
      schemaPath,
      getDocPreferences,
      getFormState,
      docPermissions
    ]
  );

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current;

    return () => {
      abortAndIgnore(abortOnChange as AbortController);
    };
  }, []);

  return (
    <OperationProvider operation="create">
      <Form
        action={action}
        className={`${baseClass}__form`}
        disabled={isInitializing || !hasSavePermission}
        initialState={isInitializing ? undefined : initialState}
        isInitializing={isInitializing}
        method="POST"
        onChange={[onChange]}
        onSuccess={onSave as FormProps["onSuccess"]}
        submitted={submitted}
      >
        <DocumentFields
          BeforeFields={
            <Fragment>
              {CustomUpload || (
                <Upload_v4
                  collectionSlug={collectionConfig!.slug}
                  customActions={[
                    folders &&
                      "folders" in collectionConfig &&
                      collectionConfig!.folders && (
                        <MoveDocToFolder
                          buttonProps={{
                            buttonStyle: "pill",
                            size: "small"
                          }}
                          folderCollectionSlug={folders.slug}
                          folderFieldName={folders.fieldName}
                          key="move-doc-to-folder"
                        />
                      )
                  ].filter(Boolean)}
                  initialState={initialState}
                  resetUploadEdits={resetUploadEdits}
                  updateUploadEdits={updateUploadEdits}
                  uploadConfig={collectionConfig.upload}
                  uploadEdits={uploadEdits}
                />
              )}
            </Fragment>
          }
          docPermissions={docPermissions!}
          fields={collectionConfig.fields}
          schemaPathSegments={[collectionConfig.slug]}
        />
        <ReportAllErrors />
        <GetFieldProxy />
      </Form>
    </OperationProvider>
  );
}

function GetFieldProxy() {
  const { getFields } = useForm();
  const { getFormDataRef } = useFormsManager();

  useEffect(() => {
    getFormDataRef.current = getFields;
  }, [getFields, getFormDataRef]);

  return null;
}

function ReportAllErrors() {
  const { docConfig } = useDocumentInfo();
  const { activeIndex, setFormTotalErrorCount } = useFormsManager();
  const errorCountRef = useRef(0);

  const reportFormErrorCount = useCallback(
    (errorCount: number) => {
      if (errorCount === errorCountRef.current) {
        return;
      }
      setFormTotalErrorCount({ errorCount, index: activeIndex });
      errorCountRef.current = errorCount;
    },
    [activeIndex, setFormTotalErrorCount]
  );

  if (!docConfig) {
    return null;
  }

  return (
    <WatchChildErrors
      fields={docConfig.fields}
      path={[]}
      setErrorCount={reportFormErrorCount}
    />
  );
}
