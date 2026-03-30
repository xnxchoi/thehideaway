"use client";

import {
  fieldReducer,
  LoadingOverlay,
  toast,
  useConfig,
  useEffectEvent,
  useLocale,
  useModal,
  useServerFunctions,
  useTranslation,
  useUploadHandlers
} from "@payloadcms/ui";
import { useLoadingOverlay } from "@payloadcms/ui/elements/LoadingOverlay";
import { hasSavePermission as getHasSavePermission } from "@payloadcms/ui/utilities/hasSavePermission";
import { createFormData } from "node_modules/@payloadcms/ui/dist/elements/BulkUpload/FormsManager/createFormData";
import type {
  CollectionSlug,
  Data,
  DataFromCollectionSlug,
  DocumentSlots,
  FormState,
  JsonObject,
  SanitizedDocumentPermissions,
  UploadCollectionSlug,
  UploadEdits
} from "payload";
import { formatAdminURL } from "payload/shared";
import { stringify } from "qs-esm";
import React, {
  createContext,
  ReactNode,
  RefObject,
  use,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState
} from "react";

import { useBulkUpload } from "../index";
import type { State } from "./reducer";
import { formsManagementReducer } from "./reducer";

type FormsManagerContext = {
  readonly activeIndex: State["activeIndex"];
  readonly addFiles: (filelist: FileList) => Promise<void>;
  readonly bulkUpdateForm: (
    updatedFields: Record<string, unknown>,
    afterStateUpdate?: () => void
  ) => Promise<void>;
  readonly collectionSlug: string;
  readonly docPermissions?: SanitizedDocumentPermissions;
  readonly documentSlots: DocumentSlots;
  readonly forms: State["forms"];
  getFormDataRef: RefObject<() => Data>;
  readonly hasPublishPermission: boolean;
  readonly hasSavePermission: boolean;
  readonly hasSubmitted: boolean;
  readonly isInitializing: boolean;
  readonly removeFile: (index: number) => void;
  readonly resetUploadEdits?: () => void;
  readonly saveAllDocs: (props?: {
    overrides?: Record<string, unknown>;
  }) => Promise<void>;
  readonly setActiveIndex: (index: number) => void;
  readonly setFormTotalErrorCount: ({
    errorCount,
    index
  }: {
    errorCount: number;
    index: number;
  }) => void;
  readonly totalErrorCount?: number;
  readonly updateUploadEdits: (args: UploadEdits) => void;
};

const Context = createContext<FormsManagerContext>({
  activeIndex: 0,
  addFiles: () => Promise.resolve(),
  bulkUpdateForm: () => null!,
  collectionSlug: "",
  docPermissions: undefined,
  documentSlots: {},
  forms: [],
  getFormDataRef: { current: () => ({}) },
  hasPublishPermission: false,
  hasSavePermission: false,
  hasSubmitted: false,
  isInitializing: false,
  removeFile: () => {},
  saveAllDocs: () => Promise.resolve(),
  setActiveIndex: () => 0,
  setFormTotalErrorCount: () => {},
  totalErrorCount: 0,
  updateUploadEdits: () => {}
});

const initialState: State = {
  activeIndex: 0,
  forms: [],
  totalErrorCount: 0
};

export type InitialForms = Array<{
  file: File;
  formID?: string;
  initialState?: FormState | null;
}>;

type FormsManagerProps = {
  readonly children: ReactNode;
};

export function FormsManagerProvider({ children }: FormsManagerProps) {
  const { config } = useConfig();
  const {
    routes: { api }
  } = config;
  const { code } = useLocale();
  const { i18n, t } = useTranslation();

  const { getDocumentSlots, getFormState } = useServerFunctions();
  const { getUploadHandler } = useUploadHandlers();

  const [documentSlots, setDocumentSlots] = useState<DocumentSlots>({});
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [docPermissions, setDocPermissions] =
    useState<SanitizedDocumentPermissions>();
  const [hasSavePermission, setHasSavePermission] = useState(false);
  const [hasPublishPermission, setHasPublishPermission] = useState(false);
  const [hasInitializedState, setHasInitializedState] = useState(false);
  const [hasInitializedDocPermissions, setHasInitializedDocPermissions] =
    useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [state, dispatch] = useReducer(formsManagementReducer, initialState);
  const { activeIndex, forms, totalErrorCount } = state;

  const formsRef = useRef(forms);
  formsRef.current = forms;

  const { toggleLoadingOverlay } = useLoadingOverlay();
  const { closeModal } = useModal();
  const {
    collectionSlug,
    drawerSlug,
    initialFiles,
    initialForms,
    onSuccess,
    setInitialFiles,
    setInitialForms,
    setSuccessfullyUploaded
  } = useBulkUpload();

  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState("");

  const hasInitializedWithFiles = useRef(false);
  const initialStateRef = useRef<FormState>(null);
  const getFormDataRef = useRef<() => Data>(() => ({}));

  const baseAPIPath = formatAdminURL({
    apiRoute: api,
    path: ""
  });

  const actionURL = `${baseAPIPath}/${collectionSlug}`;

  const initializeSharedDocPermissions = useCallback(async () => {
    const params = {
      locale: code || undefined
    };

    const docAccessURL = `/${collectionSlug}/access`;
    const res = await fetch(
      `${baseAPIPath}${docAccessURL}?${stringify(params)}`,
      {
        credentials: "include",
        headers: {
          "Accept-Language": i18n.language,
          "Content-Type": "application/json"
        },
        method: "post"
      }
    );

    const json: SanitizedDocumentPermissions = await res.json();
    const publishedAccessJSON = await fetch(
      `${baseAPIPath}${docAccessURL}?${stringify(params)}`,
      {
        body: JSON.stringify({
          _status: "published"
        }),
        credentials: "include",
        headers: {
          "Accept-Language": i18n.language,
          "Content-Type": "application/json"
        },
        method: "POST"
      }
    ).then((res) => res.json());

    setDocPermissions(json);

    setHasSavePermission(
      getHasSavePermission({
        collectionSlug,
        docPermissions: json,
        isEditing: false
      })
    );

    setHasPublishPermission(publishedAccessJSON?.update);
    setHasInitializedDocPermissions(true);
  }, [baseAPIPath, code, collectionSlug, i18n.language]);

  const initializeSharedFormState = useCallback(
    async (abortController?: AbortController) => {
      if (abortController?.signal) {
        abortController.abort(
          "aborting previous fetch for initial form state without files"
        );
      }

      // FETCH AND SET THE DOCUMENT SLOTS HERE!
      const documentSlots = await getDocumentSlots({ collectionSlug });
      setDocumentSlots(documentSlots);

      try {
        const { state: formStateWithoutFiles } = await getFormState({
          collectionSlug,
          docPermissions,
          docPreferences: { fields: {} },
          locale: code,
          operation: "create",
          renderAllFields: true,
          schemaPath: collectionSlug,
          skipValidation: true
        });
        initialStateRef.current = formStateWithoutFiles || null;
        setHasInitializedState(true);
      } catch (_err) {
        // swallow error
      }
    },
    [getDocumentSlots, collectionSlug, getFormState, docPermissions, code]
  );

  const setActiveIndex: FormsManagerContext["setActiveIndex"] = useCallback(
    (index: number) => {
      const currentFormsData = getFormDataRef.current();
      dispatch({
        type: "REPLACE",
        state: {
          activeIndex: index,
          forms: forms.map((form, i) => {
            if (i === activeIndex) {
              return {
                errorCount: form.errorCount,
                formID: form.formID,
                formState: currentFormsData,
                uploadEdits: form.uploadEdits
              };
            }
            return form;
          })
        }
      });
    },
    [forms, activeIndex]
  );

  const addFiles = useCallback(
    async (files: FileList) => {
      if (forms.length) {
        // save the state of the current form before adding new files
        dispatch({
          type: "UPDATE_FORM",
          errorCount: forms[activeIndex].errorCount,
          formState: getFormDataRef.current(),
          index: activeIndex
        });
      }

      toggleLoadingOverlay({ isLoading: true, key: "addingDocs" });
      if (!hasInitializedState) {
        await initializeSharedFormState();
      }
      dispatch({
        type: "ADD_FORMS",
        forms: Array.from(files).map((file) => ({
          file,
          initialState: initialStateRef.current
        }))
      });
      toggleLoadingOverlay({ isLoading: false, key: "addingDocs" });
    },
    [
      initializeSharedFormState,
      hasInitializedState,
      toggleLoadingOverlay,
      activeIndex,
      forms
    ]
  );

  const addFilesEffectEvent = useEffectEvent(addFiles);

  const addInitialForms = useEffectEvent(async (initialForms: InitialForms) => {
    toggleLoadingOverlay({ isLoading: true, key: "addingDocs" });

    if (!hasInitializedState) {
      await initializeSharedFormState();
    }

    dispatch({
      type: "ADD_FORMS",
      forms: initialForms.map((form) => ({
        ...form,
        initialState: form?.initialState || initialStateRef.current
      }))
    });

    toggleLoadingOverlay({ isLoading: false, key: "addingDocs" });
  });

  const removeFile: FormsManagerContext["removeFile"] = useCallback((index) => {
    dispatch({ type: "REMOVE_FORM", index });
  }, []);

  const setFormTotalErrorCount: FormsManagerContext["setFormTotalErrorCount"] =
    useCallback(({ errorCount, index }) => {
      dispatch({
        type: "UPDATE_ERROR_COUNT",
        count: errorCount,
        index
      });
    }, []);

  const saveAllDocs: FormsManagerContext["saveAllDocs"] = useCallback(
    async (props: Parameters<FormsManagerContext["saveAllDocs"]>[0]) => {
      const overrides = props?.overrides || {};
      const currentFormsData = getFormDataRef.current();
      const currentForms = [...forms];
      currentForms[activeIndex] = {
        errorCount: currentForms[activeIndex].errorCount,
        formID: currentForms[activeIndex].formID,
        formState: currentFormsData,
        uploadEdits: currentForms[activeIndex].uploadEdits
      };
      const newDocs: Array<{
        collectionSlug: CollectionSlug;
        doc: JsonObject;
        /**
         * ID of the form that created this document
         */
        formID: string;
      }> = [];

      setIsUploading(true);

      for (let i = 0; i < currentForms.length; i++) {
        try {
          const form = currentForms[i];
          const fileValue = form.formState?.file?.value;

          // Skip upload if file is missing a filename
          if (
            fileValue &&
            typeof fileValue === "object" &&
            "name" in fileValue &&
            (!fileValue.name || fileValue.name === "")
          ) {
            currentForms[i] = {
              ...currentForms[i],
              errorCount: 1
            };
            continue;
          }

          setLoadingText(
            t("general:uploadingBulk", {
              current: i + 1,
              total: currentForms.length
            })
          );

          const actionURLWithParams = `${actionURL}${stringify(
            {
              locale: code,
              uploadEdits: form?.uploadEdits || undefined
            },
            {
              addQueryPrefix: true
            }
          )}`;

          const req = await fetch(actionURLWithParams, {
            body: await createFormData(
              form.formState,
              overrides,
              collectionSlug,
              getUploadHandler({
                collectionSlug: collectionSlug as UploadCollectionSlug
              })
            ),
            credentials: "include",
            method: "POST"
          });

          const json = (await req.json()) as {
            doc?: DataFromCollectionSlug<typeof collectionSlug>;
            message?: string;
            errors?: Array<
              | Error
              | {
                  data?: {
                    errors?: Array<{
                      message: string;
                      path?: string;
                    }>;
                  };
                }
            >;
          };

          if (req.status === 201 && json?.doc) {
            newDocs.push({
              collectionSlug,
              doc: json.doc,
              formID: form.formID
            });
          }

          // should expose some sort of helper for this
          const [fieldErrors, nonFieldErrors] = (json?.errors || []).reduce(
            ([fieldErrs, nonFieldErrs], err) => {
              const newFieldErrs: any[] = [];
              const newNonFieldErrs: any[] = [];

              if (err?.message) {
                newNonFieldErrs.push(err);
              }

              if (Array.isArray(err?.data?.errors)) {
                err.data?.errors.forEach((dataError) => {
                  if (dataError?.path) {
                    newFieldErrs.push(dataError);
                  } else {
                    newNonFieldErrs.push(dataError);
                  }
                });
              }

              return [
                [...fieldErrs, ...newFieldErrs],
                [...nonFieldErrs, ...newNonFieldErrs]
              ];
            },
            [[], []]
          );

          currentForms[i] = {
            errorCount: fieldErrors.length,
            formID: currentForms[i].formID,
            formState: fieldReducer(currentForms[i].formState, {
              type: "ADD_SERVER_ERRORS",
              errors: fieldErrors
            })
          };

          if (req.status === 413 || req.status === 400) {
            // file too large
            currentForms[i] = {
              ...currentForms[i],
              errorCount: currentForms[i].errorCount + 1
            };

            toast.error(nonFieldErrors[0]?.message);
          }
        } catch (_) {
          // swallow
        }
      }

      setHasSubmitted(true);
      setLoadingText("");
      setIsUploading(false);

      const remainingForms: State["forms"] = [];

      currentForms.forEach(({ errorCount }, i) => {
        if (errorCount) {
          remainingForms.push(currentForms[i]);
        }
      });

      const successCount = Math.max(
        0,
        currentForms.length - remainingForms.length
      );
      const errorCount = currentForms.length - successCount;

      if (successCount) {
        toast.success(`Successfully saved ${successCount} files`);
        setSuccessfullyUploaded(true);

        if (typeof onSuccess === "function") {
          onSuccess(newDocs, errorCount);
        }
      }

      if (errorCount) {
        toast.error(`Failed to save ${errorCount} files`);
      } else {
        closeModal(drawerSlug);
      }

      dispatch({
        type: "REPLACE",
        state: {
          activeIndex: 0,
          forms: remainingForms,
          totalErrorCount: remainingForms.reduce(
            (acc, { errorCount }) => acc + errorCount,
            0
          )
        }
      });

      if (remainingForms.length === 0) {
        setInitialFiles(undefined);
        setInitialForms(undefined);
      }
    },
    [
      forms,
      activeIndex,
      t,
      actionURL,
      code,
      collectionSlug,
      getUploadHandler,
      onSuccess,
      closeModal,
      setSuccessfullyUploaded,
      drawerSlug,
      setInitialFiles,
      setInitialForms
    ]
  );

  const bulkUpdateForm = useCallback(
    async (
      updatedFields: Record<string, unknown>,
      afterStateUpdate?: () => void
    ) => {
      for (let i = 0; i < forms.length; i++) {
        Object.entries(updatedFields).forEach(([path, value]) => {
          if (forms[i].formState[path]) {
            forms[i].formState[path].value = value;

            dispatch({
              type: "UPDATE_FORM",
              errorCount: forms[i].errorCount,
              formState: forms[i].formState,
              index: i
            });
          }
        });

        if (typeof afterStateUpdate === "function") {
          afterStateUpdate();
        }

        if (hasSubmitted) {
          const { state } = await getFormState({
            collectionSlug,
            docPermissions,
            docPreferences: null!,
            formState: forms[i].formState,
            operation: "create",
            schemaPath: collectionSlug
          });
          if (!state) throw new Error("state is undefined");
          const newFormErrorCount = Object.values(state).reduce(
            (acc, value) => (value?.valid === false ? acc + 1 : acc),
            0
          );

          dispatch({
            type: "UPDATE_FORM",
            errorCount: newFormErrorCount,
            formState: state,
            index: i
          });
        }
      }
    },
    [collectionSlug, docPermissions, forms, getFormState, hasSubmitted]
  );

  const updateUploadEdits = useCallback<
    FormsManagerContext["updateUploadEdits"]
  >(
    (uploadEdits) => {
      dispatch({
        type: "UPDATE_FORM",
        errorCount: forms[activeIndex].errorCount,
        formState: forms[activeIndex].formState,
        index: activeIndex,
        uploadEdits
      });
    },
    [activeIndex, forms]
  );

  const resetUploadEdits = useCallback<
    NonNullable<FormsManagerContext["resetUploadEdits"]>
  >(() => {
    dispatch({
      type: "REPLACE",
      state: {
        forms: forms.map((form) => ({
          ...form,
          uploadEdits: {}
        }))
      }
    });
  }, [forms]);

  useEffect(() => {
    if (!collectionSlug) {
      return;
    }
    if (!hasInitializedState) {
      void initializeSharedFormState();
    }

    if (!hasInitializedDocPermissions) {
      void initializeSharedDocPermissions();
    }

    if (initialFiles || initialForms) {
      if (!hasInitializedState || !hasInitializedDocPermissions) {
        setIsInitializing(true);
      } else {
        setIsInitializing(false);
      }
    }

    if (
      hasInitializedState &&
      (initialForms?.length || initialFiles?.length) &&
      !hasInitializedWithFiles.current
    ) {
      if (initialForms?.length) {
        void addInitialForms(initialForms);
      }
      if (initialFiles?.length) {
        void addFilesEffectEvent(initialFiles);
      }
      hasInitializedWithFiles.current = true;
    }
    return;
  }, [
    initialFiles,
    initializeSharedFormState,
    initializeSharedDocPermissions,
    collectionSlug,
    hasInitializedState,
    hasInitializedDocPermissions,
    initialForms
  ]);

  return (
    <Context
      value={{
        activeIndex: state.activeIndex,
        addFiles,
        bulkUpdateForm,
        collectionSlug,
        docPermissions,
        documentSlots,
        forms,
        getFormDataRef,
        hasPublishPermission,
        hasSavePermission,
        hasSubmitted,
        isInitializing,
        removeFile,
        resetUploadEdits,
        saveAllDocs,
        setActiveIndex,
        setFormTotalErrorCount,
        totalErrorCount,
        updateUploadEdits
      }}
    >
      {isUploading && (
        <LoadingOverlay
          animationDuration="250ms"
          loadingText={loadingText}
          overlayType="fullscreen"
          show
        />
      )}
      {children}
    </Context>
  );
}

export function useFormsManager() {
  return use(Context);
}
