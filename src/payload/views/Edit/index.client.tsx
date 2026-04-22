"use client";

import {
  CopyLocaleDataDrawer,
  LocaleDataCopyProvider
} from "@/payload/elements/CopyLocaleData";
import { DocumentControls } from "@/payload/elements/DocumentControls";
import { DocumentFields } from "@/payload/elements/DocumentFields";
import { CourierProvider } from "@/payload/elements/DocumentFields/RP_CourierProvider";
import { Upload } from "@/payload/elements/Upload";
import {
  DevThrottledLeaveGuard,
  IS_DEV_LEAVE_DEBOUNCE_ENABLED
} from "@/payload/views/Edit/DevThrottledLeaveGuard";

import {
  DocumentLocked,
  DocumentTakeOver,
  Form,
  LeaveWithoutSaving,
  OperationProvider,
  SetDocumentStepNav,
  SetDocumentTitle,
  useAuth,
  useConfig,
  useDocumentDrawerContext,
  useDocumentEvents,
  useDocumentInfo,
  useEditDepth,
  useRouteCache,
  useRouteTransition,
  useServerFunctions,
  useUploadEdits
} from "@payloadcms/ui";
import { DocumentDrawerHeader } from "@payloadcms/ui/elements/DocumentDrawer/DrawerHeader";
import { LivePreviewWindow } from "@payloadcms/ui/elements/LivePreview/Window";
import { UploadControlsProvider } from "@payloadcms/ui/providers/UploadControls";
import {
  abortAndIgnore,
  handleAbortRef,
  handleBackToDashboard,
  handleGoBack,
  handleTakeOver
} from "@payloadcms/ui/shared";
import type { LockedState } from "@payloadcms/ui/utilities/buildFormState";

import { useRouter, useSearchParams } from "next/navigation";
import type { FormOnSuccess } from "node_modules/@payloadcms/ui/dist/forms/Form/types";
import {
  useLivePreviewContext,
  usePreviewURL
} from "node_modules/@payloadcms/ui/dist/providers/LivePreview/context";
import type {
  ClientCollectionConfig,
  ClientGlobalConfig,
  ClientUser,
  CollectionConfig,
  CollectionSlug,
  DocumentViewClientProps,
  FormState,
  GlobalSlug
} from "payload";
import { formatAdminURL } from "payload/shared";
import {
  type Dispatch,
  Fragment,
  type RefObject,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { Auth } from "./Auth";

const baseClass = "estate collection-edit";

export type OnSaveContext = {
  getDocPermissions?: boolean;
  incrementVersionCount?: boolean;
};

// This component receives props only on _pages_
// When rendered within a drawer, props are empty
// This is solely to support custom edit views which get server-rendered
export function DefaultEditView({
  BeforeDocumentControls,
  Description,
  EditMenuItems,
  PreviewButton,
  PublishButton,
  SaveButton,
  SaveDraftButton,
  Upload: CustomUpload,
  UploadControls
}: DocumentViewClientProps) {
  const {
    id,
    action,
    AfterDocument,
    AfterFields,
    apiURL,
    BeforeFields,
    collectionSlug,
    currentEditor,
    data,
    disableActions,
    disableCreate,
    disableLeaveWithoutSaving,
    docPermissions,
    documentIsLocked,
    documentLockState,
    getDocPermissions,
    getDocPreferences,
    globalSlug,
    hasPublishPermission,
    hasSavePermission,
    incrementVersionCount,
    initialState,
    isEditing,
    isInitializing,
    isLocked,
    isTrashed,
    lastUpdateTime,
    redirectAfterCreate,
    redirectAfterDelete,
    redirectAfterDuplicate,
    redirectAfterRestore,
    setCurrentEditor,
    setData,
    setDocumentIsLocked,
    setLastUpdateTime,
    unlockDocument,
    updateDocumentEditor
  } = useDocumentInfo();

  const {
    clearDoc,
    drawerSlug,
    onDelete,
    onDuplicate,
    onRestore,
    onSave: onSaveFromContext
  } = useDocumentDrawerContext();

  const isInDrawer = Boolean(drawerSlug);

  const { refreshCookieAsync, user } = useAuth();

  const {
    config,
    config: {
      admin: { user: userSlug },
      routes: { admin: adminRoute }
    },
    getEntityConfig
  } = useConfig();
  const isRUn = useRef(false);
  useEffect(() => {
    if (
      Boolean(
        collectionSlug ||
        currentEditor ||
        data ||
        docPermissions ||
        documentIsLocked ||
        documentLockState ||
        disableActions
      ) &&
      !isRUn.current
    ) {
      console.log("doc info");
      console.log({
        collectionSlug,
        currentEditor,
        data,
        docPermissions,
        documentIsLocked,
        documentLockState,
        disableActions
      });
      isRUn.current = true;
    }
  }, [
    collectionSlug,
    currentEditor,
    data,
    disableActions,
    docPermissions,
    documentIsLocked,
    documentLockState
  ]);

  const collectionConfig = getEntityConfig({
    collectionSlug
  }) as ClientCollectionConfig | null;
  const globalConfig = getEntityConfig({
    globalSlug
  }) as ClientGlobalConfig | null;

  const depth = useEditDepth();

  const router = useRouter();
  const params = useSearchParams();
  const { reportUpdate } = useDocumentEvents();
  const { resetUploadEdits } = useUploadEdits();
  const { getFormState } = useServerFunctions();
  const { startRouteTransition } = useRouteTransition();
  const { clearRouteCache } = useRouteCache();
  const {
    isLivePreviewEnabled,
    isLivePreviewing,
    previewWindowType,
    setURL: setLivePreviewURL,
    typeofLivePreviewURL,
    url: livePreviewURL
  } = useLivePreviewContext();
  const { isPreviewEnabled, setPreviewURL } = usePreviewURL();

  const abortOnChangeRef = useRef<AbortController>(null);
  const abortOnSaveRef = useRef<AbortController>(null);

  const locale = params.get("locale");
  const localization = config.localization;
  const entitySlug = collectionConfig?.slug || globalConfig?.slug;

  const operation = collectionSlug && !id ? "create" : "update";

  const showCopyToLocale =
    localization && !collectionConfig?.admin?.disableCopyToLocale;
  const auth =
    collectionConfig && "auth" in collectionConfig
      ? collectionConfig.auth
      : undefined;
  const upload =
    collectionConfig && "upload" in collectionConfig
      ? collectionConfig.upload
      : undefined;

  const docConfig = collectionConfig || globalConfig;

  const lockDocumentsProp =
    docConfig?.lockDocuments !== undefined ? docConfig?.lockDocuments : true;
  const isLockingEnabled = lockDocumentsProp !== false;

  const lockDurationDefault = 300; // Default 5 minutes in seconds
  const lockDuration =
    typeof lockDocumentsProp === "object"
      ? lockDocumentsProp.duration
      : lockDurationDefault;
  const lockDurationInMilliseconds = lockDuration * 1000;

  const autosaveEnabled = Boolean(
    (collectionConfig?.versions?.drafts &&
      collectionConfig?.versions?.drafts?.autosave) ||
    (globalConfig?.versions?.drafts && globalConfig?.versions?.drafts?.autosave)
  );

  const preventLeaveWithoutSaving =
    typeof disableLeaveWithoutSaving !== "undefined"
      ? !disableLeaveWithoutSaving
      : !autosaveEnabled;

  const [isReadOnlyForIncomingUser, setIsReadOnlyForIncomingUser] =
    useState(false);
  const [showTakeOverModal, setShowTakeOverModal] = useState(false);

  const [editSessionStartTime, setEditSessionStartTime] = useState(Date.now());

  const lockExpiryTime = lastUpdateTime + lockDurationInMilliseconds;

  const isLockExpired = Date.now() > lockExpiryTime;

  const schemaPathSegments = useMemo(() => [entitySlug], [entitySlug]);

  const [validateBeforeSubmit, setValidateBeforeSubmit] = useState(() => {
    if (operation === "create" && auth && !auth.disableLocalStrategy) {
      return true;
    }

    return false;
  });

  const nextHrefRef = useRef<null | string>(null);

  const handleDocumentLocking = useCallback(
    (lockedState: LockedState) => {
      setDocumentIsLocked?.(true);
      const previousOwnerID =
        typeof documentLockState.current?.user === "object"
          ? documentLockState.current?.user?.id
          : documentLockState.current?.user;

      if (lockedState) {
        const lockedUserID =
          typeof lockedState.user === "string" ||
          typeof lockedState.user === "number"
            ? lockedState.user
            : lockedState.user?.id;

        if (!documentLockState.current || lockedUserID !== previousOwnerID) {
          if (previousOwnerID === user?.id && lockedUserID !== user?.id) {
            setShowTakeOverModal(true);
            documentLockState.current &&
              (documentLockState.current.hasShownLockedModal = true);
          }

          documentLockState.current = {
            hasShownLockedModal:
              documentLockState.current?.hasShownLockedModal || false,
            isLocked: true,
            user: lockedState.user as ClientUser
          };
          setCurrentEditor?.(lockedState.user as ClientUser);
        }

        // Update lastUpdateTime when lock state changes
        if (lockedState.lastEditedAt) {
          setLastUpdateTime(new Date(lockedState.lastEditedAt).getTime());
        }
      }
    },
    [
      documentLockState,
      setCurrentEditor,
      setDocumentIsLocked,
      setLastUpdateTime,
      user?.id
    ]
  );

  const handlePrevent = useCallback((nextHref: null | string) => {
    nextHrefRef.current = nextHref;
  }, []);

  const handleLeaveConfirm = useCallback(async () => {
    const lockUser = documentLockState.current?.user;

    const isLockOwnedByCurrentUser =
      typeof lockUser === "object"
        ? lockUser?.id === user?.id
        : lockUser === user?.id;

    if (isLockingEnabled && documentIsLocked && (id || globalSlug)) {
      // Check where user is trying to go
      const nextPath = nextHrefRef.current
        ? new URL(nextHrefRef.current).pathname
        : "";
      const isInternalView = ["/preview", "/api", "/versions"].some((path) =>
        nextPath.includes(path)
      );

      const slug = collectionSlug || globalSlug;
      // Only retain the lock if the user is still viewing the document
      if (!isInternalView && id && slug) {
        if (isLockOwnedByCurrentUser) {
          try {
            await unlockDocument(id, slug);
            setDocumentIsLocked?.(false);
            setCurrentEditor?.(null!);
          } catch (err) {
            console.error("Failed to unlock before leave", err); // eslint-disable-line no-console
          }
        }
      }
    }
  }, [
    collectionSlug,
    documentIsLocked,
    globalSlug,
    id,
    isLockingEnabled,
    setCurrentEditor,
    setDocumentIsLocked,
    unlockDocument,
    user?.id
  ]);

  const onSave: FormOnSuccess<any, OnSaveContext> = useCallback(
    async (json, ctx) => {
      const { context, formState } = ctx || {};
      const abortController = abortOnSaveRef.current;

      const controller = handleAbortRef(
        abortOnSaveRef as RefObject<AbortController>
      );

      const document = json?.doc || json?.result;

      const updatedAt = document?.updatedAt || new Date().toISOString();

      // If we're editing the doc of the logged-in user,
      // Refresh the cookie to get new permissions
      if (user && collectionSlug === userSlug && id === user.id) {
        void refreshCookieAsync();
      }

      setLastUpdateTime(updatedAt);

      if (context?.incrementVersionCount !== false) {
        incrementVersionCount();
      }

      if (typeof setData === "function") {
        void setData(document || {});
      }

      if (typeof onSaveFromContext === "function") {
        const operation = id ? "update" : "create";

        void onSaveFromContext({
          ...(json as Record<string, unknown>),
          context,
          operation,
          // @ts-expect-error todo: this is not right, should be under `doc`?
          updatedAt:
            operation === "update"
              ? new Date().toISOString()
              : document?.updatedAt || new Date().toISOString()
        });
      }

      if (!isEditing && depth < 2 && redirectAfterCreate !== false) {
        // Redirect to the same locale if it's been set
        const redirectRoute = formatAdminURL({
          adminRoute,
          path: `/collections/${collectionSlug}/${document?.id}${locale ? `?locale=${locale}` : ""}`
        });

        startRouteTransition(() => router.push(redirectRoute));
      } else {
        resetUploadEdits();
      }

      if (context?.getDocPermissions !== false) {
        await getDocPermissions(json);
      }

      if (id || globalSlug) {
        const docPreferences = await getDocPreferences();

        const { livePreviewURL, state } = await getFormState({
          id,
          collectionSlug,
          data: document,
          docPermissions,
          docPreferences,
          formState,
          globalSlug,
          operation,
          renderAllFields: false,
          returnLivePreviewURL:
            isLivePreviewEnabled && typeofLivePreviewURL === "function",
          returnLockStatus: false,
          schemaPath: schemaPathSegments.join("."),
          signal: controller.signal,
          skipValidation: true
        });

        // Unlock the document after save
        if (isLockingEnabled) {
          setDocumentIsLocked?.(false);
        }

        if (
          isLivePreviewEnabled &&
          typeofLivePreviewURL === "function" &&
          livePreviewURL
        ) {
          setLivePreviewURL(livePreviewURL);
        }

        entitySlug &&
          reportUpdate({
            id,
            entitySlug,
            doc: document,
            updatedAt,
            operation: "update"
          });

        abortOnSaveRef.current = null;

        return state;
      } else {
        entitySlug &&
          reportUpdate({
            id,
            doc: document,
            drawerSlug,
            entitySlug,
            operation: "create",
            updatedAt
          });
      }
    },
    [
      reportUpdate,
      id,
      entitySlug,
      user,
      drawerSlug,
      collectionSlug,
      userSlug,
      setLastUpdateTime,
      setData,
      onSaveFromContext,
      isEditing,
      depth,
      redirectAfterCreate,
      setLivePreviewURL,
      setPreviewURL,
      globalSlug,
      refreshCookieAsync,
      incrementVersionCount,
      adminRoute,
      locale,
      startRouteTransition,
      router,
      resetUploadEdits,
      getDocPermissions,
      getDocPreferences,
      getFormState,
      docPermissions,
      operation,
      isLivePreviewEnabled,
      isPreviewEnabled,
      typeofLivePreviewURL,
      schemaPathSegments,
      isLockingEnabled,
      setDocumentIsLocked
    ]
  );
  type onChangeProps = (props: {
    formState: FormState;
    submitted?: boolean;
  }) => Promise<FormState>;
  const onChange: onChangeProps = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(
        abortOnChangeRef as RefObject<AbortController>
      );

      const currentTime = Date.now();
      const timeSinceLastUpdate = currentTime - editSessionStartTime;

      const updateLastEdited = isLockingEnabled && timeSinceLastUpdate >= 10000; // 10 seconds

      if (updateLastEdited) {
        setEditSessionStartTime(currentTime);
      }

      const docPreferences = await getDocPreferences();

      const result = await getFormState({
        id,
        collectionSlug,
        docPermissions,
        docPreferences,
        formState: prevFormState,
        globalSlug,
        operation,
        renderAllFields: false,
        returnLockStatus: isLockingEnabled,
        schemaPath: schemaPathSegments.join("."),
        signal: controller.signal,
        skipValidation: !submitted,
        updateLastEdited
      });

      if (!result) {
        throw new Error("Failed to get form state");
      }

      const { lockedState, state } = result;

      if (isLockingEnabled) {
        lockedState && handleDocumentLocking(lockedState);
      }

      abortOnChangeRef.current = null;
      if (!state) {
        throw new Error("Failed to get form state");
      }

      return state;
    },
    [
      editSessionStartTime,
      isLockingEnabled,
      getDocPreferences,
      getFormState,
      id,
      collectionSlug,
      docPermissions,
      globalSlug,
      operation,
      schemaPathSegments,
      handleDocumentLocking
    ]
  );

  // Clean up when the component unmounts or when the document is unlocked
  useEffect(() => {
    return () => {
      setShowTakeOverModal(false);
    };
  }, []);

  useEffect(() => {
    const abortOnChange = abortOnChangeRef.current;
    const abortOnSave = abortOnSaveRef.current;

    return () => {
      abortOnChange && abortAndIgnore(abortOnChange);
      abortOnSave && abortAndIgnore(abortOnSave);
    };
  }, []);

  const shouldShowDocumentLockedModal =
    documentIsLocked &&
    currentEditor &&
    (typeof currentEditor === "object"
      ? currentEditor.id !== user?.id
      : currentEditor !== user?.id) &&
    !isReadOnlyForIncomingUser &&
    !showTakeOverModal &&
    !documentLockState.current?.hasShownLockedModal &&
    !isLockExpired;

  const isFolderCollection =
    config.folders && collectionSlug === config.folders?.slug;

  return (
    user &&
    docPermissions && (
      <main
        className={[
          baseClass,
          (id || globalSlug) && `${baseClass}--is-editing`,
          globalSlug && `global-edit--${globalSlug}`,
          collectionSlug && `collection-edit--${collectionSlug}`,
          isLivePreviewing &&
            previewWindowType === "iframe" &&
            `${baseClass}--is-live-previewing`
        ]
          .filter(Boolean)
          .join(" ")}
        id="estate-main"
      >
        <OperationProvider operation={operation}>
          <Form
            action={action}
            className={`${baseClass}__form`}
            disabled={
              isReadOnlyForIncomingUser ||
              isInitializing ||
              !hasSavePermission ||
              isTrashed
            }
            disableValidationOnSubmit={!validateBeforeSubmit}
            initialState={!isInitializing ? initialState : undefined}
            isDocumentForm={true}
            isInitializing={isInitializing}
            key={`${isLocked}`}
            method={id ? "PATCH" : "POST"}
            onChange={[onChange]}
            onSuccess={onSave}
          >
            <CourierProvider>
              <LocaleDataCopyProvider>
                {isInDrawer && (
                  <DocumentDrawerHeader
                    drawerSlug={drawerSlug}
                    showDocumentID={!isFolderCollection}
                  />
                )}
                {documentLockState.current &&
                  isLockingEnabled &&
                  collectionSlug &&
                  setCurrentEditor &&
                  shouldShowDocumentLockedModal && (
                    <DocumentLocked
                      handleGoBack={() =>
                        handleGoBack({ adminRoute, collectionSlug, router })
                      }
                      isActive={shouldShowDocumentLockedModal}
                      onReadOnly={() => {
                        setIsReadOnlyForIncomingUser(true);
                        setShowTakeOverModal(false);
                      }}
                      onTakeOver={() =>
                        id
                          ? handleTakeOver({
                              id,
                              clearRouteCache,
                              collectionSlug,
                              documentLockStateRef:
                                documentLockState as RefObject<{
                                  hasShownLockedModal: boolean;
                                  isLocked: boolean;
                                  user: ClientUser | number | string;
                                }>,
                              globalSlug,
                              isLockingEnabled,
                              isWithinDoc: false,
                              setCurrentEditor: setCurrentEditor as Dispatch<
                                SetStateAction<ClientUser | number | string>
                              >,
                              updateDocumentEditor: updateDocumentEditor as (
                                docID: number | string,
                                slug: string,
                                user: ClientUser | number | string
                              ) => Promise<void>,
                              user
                            })
                          : void 0
                      }
                      updatedAt={lastUpdateTime}
                      user={currentEditor}
                    />
                  )}
                {isLockingEnabled && showTakeOverModal && (
                  <DocumentTakeOver
                    handleBackToDashboard={() =>
                      handleBackToDashboard({ adminRoute, router })
                    }
                    isActive={showTakeOverModal}
                    onReadOnly={() => {
                      setIsReadOnlyForIncomingUser(true);
                      setShowTakeOverModal(false);
                    }}
                  />
                )}
                {!isReadOnlyForIncomingUser && preventLeaveWithoutSaving && (
                  <>
                    <LeaveWithoutSaving
                      disablePreventLeave={IS_DEV_LEAVE_DEBOUNCE_ENABLED}
                      onConfirm={handleLeaveConfirm}
                      onPrevent={handlePrevent}
                    />
                    {IS_DEV_LEAVE_DEBOUNCE_ENABLED && (
                      <DevThrottledLeaveGuard />
                    )}
                  </>
                )}
                {!isInDrawer && (
                  <SetDocumentStepNav
                    collectionSlug={
                      (collectionConfig as CollectionConfig | null)?.slug as
                        | CollectionSlug
                        | undefined
                    }
                    globalSlug={globalConfig?.slug as GlobalSlug | undefined}
                    id={id}
                    isTrashed={isTrashed}
                    pluralLabel={collectionConfig?.labels?.plural}
                    useAsTitle={collectionConfig?.admin?.useAsTitle}
                  />
                )}
                <SetDocumentTitle
                  collectionConfig={collectionConfig || undefined}
                  config={config}
                  fallback={depth <= 1 ? `${id}` : ""}
                  globalConfig={globalConfig || undefined}
                />
                {documentLockState.current && setCurrentEditor && (
                  <DocumentControls
                    apiURL={apiURL || ""}
                    BeforeDocumentControls={BeforeDocumentControls}
                    customComponents={{
                      PreviewButton,
                      PublishButton,
                      SaveButton,
                      SaveDraftButton
                    }}
                    data={data}
                    disableActions={
                      disableActions || isFolderCollection || isTrashed
                    }
                    disableCreate={disableCreate}
                    EditMenuItems={EditMenuItems}
                    hasPublishPermission={hasPublishPermission}
                    hasSavePermission={hasSavePermission}
                    id={id}
                    isEditing={isEditing}
                    isInDrawer={isInDrawer}
                    isTrashed={isTrashed}
                    onDelete={onDelete}
                    onDrawerCreateNew={clearDoc}
                    onDuplicate={onDuplicate}
                    onRestore={onRestore}
                    onSave={onSave}
                    onTakeOver={() =>
                      id
                        ? handleTakeOver({
                            id,
                            clearRouteCache,
                            collectionSlug,
                            documentLockStateRef:
                              documentLockState as RefObject<{
                                hasShownLockedModal: boolean;
                                isLocked: boolean;
                                user: ClientUser | number | string;
                              }>,
                            globalSlug,
                            isLockingEnabled,
                            isWithinDoc: true,
                            setCurrentEditor: setCurrentEditor as Dispatch<
                              SetStateAction<ClientUser | number | string>
                            >,
                            setIsReadOnlyForIncomingUser,
                            updateDocumentEditor: updateDocumentEditor as (
                              docID: number | string,
                              slug: string,
                              user: ClientUser | number | string
                            ) => Promise<void>,
                            user
                          })
                        : void 0
                    }
                    permissions={docPermissions}
                    readOnlyForIncomingUser={isReadOnlyForIncomingUser}
                    redirectAfterDelete={redirectAfterDelete}
                    redirectAfterDuplicate={redirectAfterDuplicate}
                    redirectAfterRestore={redirectAfterRestore}
                    slug={
                      (collectionConfig?.slug ||
                        globalConfig?.slug) as CollectionSlug
                    }
                    user={currentEditor}
                  />
                )}
                <div
                  className={[
                    `${baseClass}__main-wrapper`,
                    previewWindowType === "popup" && `${baseClass}--detached`
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div
                    className={[
                      `${baseClass}__main`,
                      previewWindowType === "popup" &&
                        `${baseClass}__main--popup-open`
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <DocumentFields
                      AfterFields={AfterFields}
                      BeforeFields={
                        BeforeFields || (
                          <Fragment>
                            {auth && collectionConfig && (
                              <Auth
                                className={`${baseClass}__auth`}
                                collectionSlug={collectionConfig.slug}
                                disableLocalStrategy={
                                  collectionConfig.auth?.disableLocalStrategy
                                }
                                email={data?.email}
                                loginWithUsername={auth?.loginWithUsername}
                                operation={operation}
                                readOnly={!hasSavePermission}
                                requirePassword={!id}
                                setValidateBeforeSubmit={
                                  setValidateBeforeSubmit
                                }
                                useAPIKey={auth.useAPIKey}
                                username={data?.username}
                                verify={auth.verify}
                              />
                            )}
                            {upload && (
                              <Fragment>
                                <UploadControlsProvider>
                                  <UploadControlsProvider>
                                    {CustomUpload || (
                                      <Upload
                                        collectionSlug={collectionConfig!.slug}
                                        initialState={initialState}
                                        uploadConfig={upload}
                                        UploadControls={UploadControls}
                                      />
                                    )}
                                  </UploadControlsProvider>
                                </UploadControlsProvider>
                              </Fragment>
                            )}
                          </Fragment>
                        )
                      }
                      Description={Description}
                      docPermissions={docPermissions}
                      fields={docConfig!.fields}
                      forceSidebarWrap={isLivePreviewing}
                      isTrashed={isTrashed}
                      readOnly={
                        isReadOnlyForIncomingUser ||
                        !hasSavePermission ||
                        isTrashed
                      }
                      schemaPathSegments={schemaPathSegments as string[]}
                    />
                    {AfterDocument}
                  </div>
                  {isLivePreviewEnabled && !isInDrawer && livePreviewURL && (
                    <>
                      {
                        <LivePreviewWindow
                          collectionSlug={collectionSlug}
                          globalSlug={globalSlug}
                        />
                      }
                    </>
                  )}
                </div>
                {apiURL &&
                  documentLockState.current &&
                  setCurrentEditor &&
                  showCopyToLocale && <CopyLocaleDataDrawer />}
              </LocaleDataCopyProvider>
            </CourierProvider>
          </Form>
        </OperationProvider>
      </main>
    )
  );
}
