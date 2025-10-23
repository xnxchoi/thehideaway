"use client";
import type {
  CollapsibleFieldClientComponent,
  DocumentPreferences
} from "payload";
import { Collapsible as CollapsibleElement } from "../../elements/Collapsible/index";
import { getTranslation } from "@payloadcms/translations";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import "./index.scss";
import {
  useTranslation,
  usePreferences,
  useDocumentInfo,
  useField,
  WatchChildErrors,
  fieldBaseClass,
  RowLabel,
  ErrorPill,
  RenderFields,
  RenderCustomComponent,
  FieldDescription,
  withCondition
} from "@payloadcms/ui";
import { mergeFieldStyles } from "@payloadcms/ui/shared";
const baseClass = "collapsible-field";

const CollapsibleFieldComponent: CollapsibleFieldClientComponent = (props) => {
  const {
    field,
    field: {
      admin: { className, description, initCollapsed = false } = {},
      fields,
      label
    } = {},
    indexPath,
    parentPath,
    parentSchemaPath,
    path,
    permissions,
    readOnly
  } = props;

  const { i18n } = useTranslation();
  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();
  const [collapsedOnMount, setCollapsedOnMount] = useState<boolean>();
  const fieldPreferencesKey = `collapsible-${path?.replace(/\./g, "__")}`;
  const [errorCount, setErrorCount] = useState(0);
  const fieldHasErrors = errorCount > 0;

  const {
    customComponents: { AfterInput, BeforeInput, Description, Label } = {},
    disabled
  } = useField({
    path
  });

  const onToggle = useCallback(
    async (newCollapsedState: boolean): Promise<void> => {
      if (!preferencesKey) return;

      const existingPreferences: DocumentPreferences =
        await getPreference(preferencesKey);

      if (preferencesKey) {
        void setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path
            ? {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [path]: {
                    ...existingPreferences?.fields?.[path],
                    collapsed: newCollapsedState
                  }
                }
              }
            : {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [fieldPreferencesKey]: {
                    ...existingPreferences?.fields?.[fieldPreferencesKey],
                    collapsed: newCollapsedState
                  }
                }
              })
        });
      }
    },
    [preferencesKey, fieldPreferencesKey, getPreference, setPreference, path]
  );

  useEffect(() => {
    const fetchInitialState = async () => {
      const baseCollapsed =
        typeof initCollapsed === "boolean" ? initCollapsed : false;
      if (preferencesKey) {
        const preferences = await getPreference(preferencesKey);
        if (!preferences?.fields) return setCollapsedOnMount(baseCollapsed);

        const preferencesFields = preferences.fields as Record<string, any>;
        if (!preferencesFields[path]) return setCollapsedOnMount(baseCollapsed);
        const specificPreference = path
          ? preferencesFields[path]?.collapsed
          : preferencesFields[fieldPreferencesKey]?.collapsed;

        if (specificPreference !== undefined) {
          setCollapsedOnMount(Boolean(specificPreference));
        } else {
          setCollapsedOnMount(baseCollapsed);
        }
      } else {
        setCollapsedOnMount(baseCollapsed);
      }
    };

    void fetchInitialState();
  }, [getPreference, preferencesKey, fieldPreferencesKey, initCollapsed, path]);

  const styles = useMemo(() => mergeFieldStyles(field), [field]);

  if (typeof collapsedOnMount !== "boolean") {
    return null;
  }

  return (
    <Fragment>
      <WatchChildErrors
        fields={fields}
        // removes the 'collapsible' path segment, i.e. `_index-0`
        path={path.split(".").slice(0, -1)}
        setErrorCount={setErrorCount}
      />
      <div
        className={[
          fieldBaseClass,
          baseClass,
          className,
          fieldHasErrors
            ? `${baseClass}--has-error`
            : `${baseClass}--has-no-error`
        ]
          .filter(Boolean)
          .join(" ")}
        id={`field-${fieldPreferencesKey}`}
        style={styles}
      >
        {BeforeInput}
        <CollapsibleElement
          className={`${baseClass}__collapsible`}
          collapsibleStyle={fieldHasErrors ? "error" : "default"}
          header={
            <div className={`${baseClass}__row-label-wrap`}>
              {label && (
                <RowLabel
                  CustomComponent={Label}
                  label={getTranslation(label, i18n)}
                  path={path}
                />
              )}
              {fieldHasErrors && (
                <ErrorPill count={errorCount} i18n={i18n} withMessage />
              )}
            </div>
          }
          initCollapsed={collapsedOnMount}
          onToggle={onToggle}
        >
          {fields &&
            fields.length > 0 &&
            indexPath &&
            parentPath &&
            parentSchemaPath &&
            permissions && (
              <RenderFields
                fields={fields}
                margins="small"
                parentIndexPath={indexPath}
                parentPath={parentPath}
                parentSchemaPath={parentSchemaPath}
                permissions={permissions}
                readOnly={readOnly || disabled}
              />
            )}
        </CollapsibleElement>
        {AfterInput}
        <RenderCustomComponent
          CustomComponent={Description}
          Fallback={<FieldDescription description={description} path={path} />}
        />
      </div>
    </Fragment>
  );
};

export const CollapsibleField = withCondition(CollapsibleFieldComponent);
