"use client";

import type { ClientCollectionConfig, FormState, SelectType } from "payload";

import { getTranslation } from "@payloadcms/translations";
import { unflatten } from "payload/shared";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import type { State } from "../FormsManager/reducer";
import type { EditManyBulkUploadsProps } from "./index";
import { RenderField } from "@/payload/forms/RenderFields/RenderField";
import { useFormsManager } from "../FormsManager/index";
import { baseClass } from "./index";
import "./index.scss";
import "@/payload/forms/RenderFields/index.scss";
import {
  Button,
  FieldPathContext,
  Form,
  useAuth,
  useModal,
  useServerFunctions,
  useTranslation,
  XIcon,
  type FormProps
} from "@payloadcms/ui";
import {
  FieldSelect,
  type OnFieldSelect
} from "@payloadcms/ui/elements/FieldSelect";
import { handleAbortRef, abortAndIgnore } from "@payloadcms/ui/shared";
import type { FieldOption } from "node_modules/@payloadcms/ui/dist/elements/FieldSelect/reduceFieldOptions";

export const EditManyBulkUploadsDrawerContent: React.FC<
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
  const plural = labels?.plural;
  const singular = labels?.singular;
  const [isInitializing, setIsInitializing] = useState(false);
  const { permissions } = useAuth();
  const { i18n, t } = useTranslation();
  const { closeModal } = useModal();
  const { bulkUpdateForm } = useFormsManager();
  const { getFormState } = useServerFunctions();
  const abortFormStateRef = React.useRef<AbortController>(null);

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
        abortFormStateRef as React.RefObject<AbortController>
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

      return state as FormState;
    },
    [getFormState, collection, collectionPermissions, select]
  );

  useEffect(() => {
    const abortFormState = abortFormStateRef.current;

    return () => {
      abortFormState && abortAndIgnore(abortFormState);
    };
  }, []);

  const handleSubmit: FormProps["onSubmit"] = useCallback(
    (formState: FormState) => {
      const pairedData = selectedFields.reduce(
        (acc, option) => {
          if (formState[option.value.path]) {
            acc[option.value.path as string] =
              formState[option.value.path].value;
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

      state &&
        dispatchFields({
          type: "UPDATE_MANY",
          formState: state
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
            label: getTranslation(forms.length > 1 ? plural! : singular!, i18n)
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
            <FieldPathContext value={null!}>
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
