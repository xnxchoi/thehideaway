"use client";

import { Button } from "@/payload/elements/Button/Button";
import { FieldPathContext } from "@/payload/forms/RenderFields/context";
import { RenderField } from "@/payload/forms/RenderFields/RenderField";
import {
  Form,
  FormProps,
  useAuth,
  useServerFunctions,
  useTranslation,
  XIcon
} from "@payloadcms/ui";
import {
  FieldSelect,
  OnFieldSelect
} from "@payloadcms/ui/elements/FieldSelect";
import { abortAndIgnore, handleAbortRef } from "@payloadcms/ui/shared";
import type { ClientCollectionConfig, SelectType } from "payload";

import { useModal } from "@payloadcms/ui";
import { getTranslation } from "@payloadcms/translations";
import { unflatten } from "payload/shared";
import React, {
  FC,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { useFormsManager } from "../FormsManager/index";
import { baseClass, EditManyBulkUploadsProps } from "./index";
import "./index.scss";
import "@/payload/forms/RenderFields/index.scss";
import { State } from "../FormsManager/reducer";
import { FieldOption } from "node_modules/@payloadcms/ui/dist/elements/FieldSelect/reduceFieldOptions";

export const EditManyBulkUploadsDrawerContent: FC<
  {
    collection: ClientCollectionConfig;
    drawerSlug: string;
    forms: State["forms"];
  } & EditManyBulkUploadsProps
> = (props) => {
  const {
    collection: { fields, labels } = {},
    collection,
    drawerSlug,
    forms
  } = props;
  if (!collection) throw new Error("Collection is not defined");
  const {
    labels: { plural, singular }
  } = collection;
  const [isInitializing, setIsInitializing] = useState(false);
  const { permissions } = useAuth();
  const { i18n, t } = useTranslation();
  const { closeModal } = useModal();
  const { bulkUpdateForm } = useFormsManager();
  const { getFormState } = useServerFunctions();
  const abortFormStateRef = useRef<AbortController>(null);

  const [selectedFields, setSelectedFields] = useState<FieldOption[]>([]);
  const collectionPermissions = permissions?.collections?.[collection.slug];

  const select = useMemo<SelectType>(() => {
    return unflatten(
      selectedFields.reduce((acc, option) => {
        acc[option.value.path] = true;
        return acc;
      }, {} as SelectType)
    );
  }, [selectedFields]);

  const onChange: NonNullable<FormProps["onChange"]>[0] = useCallback(
    async ({ formState: prevFormState, submitted }) => {
      const controller = handleAbortRef(
        abortFormStateRef as RefObject<AbortController>
      );

      const { state } = await getFormState({
        collectionSlug: collection.slug,
        docPermissions: collectionPermissions,
        docPreferences: null!,
        formState: prevFormState,
        operation: "update",
        schemaPath: collection.slug,
        select,
        signal: controller.signal,
        skipValidation: !submitted
      });

      abortFormStateRef.current = null;

      return state!;
    },
    [getFormState, collection, collectionPermissions, select]
  );

  useEffect(() => {
    const abortFormState = abortFormStateRef.current;

    return () => {
      abortAndIgnore(abortFormState!);
    };
  }, []);

  const handleSubmit: NonNullable<FormProps["onSubmit"]> = useCallback(
    (formState) => {
      const pairedData = selectedFields.reduce(
        (acc, option) => {
          if (formState[option.value.path]) {
            acc[option.value.path] = formState[option.value.path].value;
          }
          return acc;
        },
        {} as Record<string, any>
      );

      void bulkUpdateForm(pairedData, () => closeModal(drawerSlug));
    },
    [closeModal, drawerSlug, bulkUpdateForm, selectedFields]
  );

  const onFieldSelect = useCallback<OnFieldSelect>(
    async ({ dispatchFields, formState, selected }) => {
      setIsInitializing(true);

      setSelectedFields(selected || []);

      const { state } = await getFormState({
        collectionSlug: collection.slug,
        docPermissions: collectionPermissions,
        docPreferences: null!,
        formState,
        operation: "update",
        schemaPath: collection.slug,
        select: unflatten(
          selected.reduce((acc, option) => {
            acc[option.value.path] = true;
            return acc;
          }, {} as SelectType)
        ),
        skipValidation: true
      });

      dispatchFields({
        type: "UPDATE_MANY",
        formState: state!
      });

      setIsInitializing(false);
    },
    [getFormState, collection, collectionPermissions]
  );

  return (
    <div className={`${baseClass}__main`}>
      <div className={`${baseClass}__header`}>
        <h2 className={`${baseClass}__header__title`}>
          {t("general:editingLabel", {
            count: forms.length,
            label: getTranslation(forms.length > 1 ? plural : singular, i18n)
          })}
        </h2>
        <button
          aria-label={t("general:close")}
          className={`${baseClass}__header__close`}
          id={`close-drawer__${drawerSlug}`}
          onClick={() => closeModal(drawerSlug)}
          type="button"
        >
          <XIcon />
        </button>
      </div>
      <Form
        className={`${baseClass}__form`}
        isInitializing={isInitializing}
        onChange={[onChange]}
        onSubmit={handleSubmit}
      >
        <FieldSelect
          fields={fields!}
          onChange={onFieldSelect}
          permissions={collectionPermissions!.fields}
        />
        {selectedFields.length === 0 ? null : (
          <div className="render-fields">
            <FieldPathContext value={undefined!}>
              {selectedFields.map((option, i) => {
                const {
                  value: { field, fieldPermissions, path }
                } = option;

                return (
                  <RenderField
                    clientFieldConfig={field}
                    indexPath=""
                    key={`${path}-${i}`}
                    parentPath=""
                    parentSchemaPath=""
                    path={path}
                    permissions={fieldPermissions}
                  />
                );
              })}
            </FieldPathContext>
          </div>
        )}
        <div className={`${baseClass}__sidebar-wrap`}>
          <div className={`${baseClass}__sidebar`}>
            <div className={`${baseClass}__sidebar-sticky-wrap`}>
              <div className={`${baseClass}__document-actions`}>
                <Button type="submit">{t("general:applyChanges")}</Button>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};
