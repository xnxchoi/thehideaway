"use client";
import { getTranslation } from "@payloadcms/translations";
import type { PayloadRequest, TextFieldClient } from "payload";
import { text } from "payload/shared";
import type { FC } from "react";
import { Fragment, useEffect, useMemo, useState } from "react";

import {
  GenerateConfirmation,
  useConfig,
  useDocumentInfo,
  useField,
  useFormFields,
  useTranslation
} from "@payloadcms/ui";
import { Button } from "@payloadcms/ui/elements/Button";
import { CopyToClipboard } from "@payloadcms/ui/elements/CopyToClipboard";
import { EyeIcon } from "@payloadcms/ui/icons/Eye";
import { v7 } from "uuid";

const path = "apiKey";
const baseClass = "api-key";
const fieldBaseClass = "field-type";

export const APIKey: FC<{
  readonly enabled: boolean;
  readonly readOnly?: boolean;
}> = ({ enabled, readOnly }) => {
  const [initialAPIKey] = useState(v7());
  const [highlightedField, setHighlightedField] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { i18n, t } = useTranslation();
  const { config, getEntityConfig } = useConfig();
  const { collectionSlug } = useDocumentInfo();

  const apiKey = useFormFields(([fields]) => (fields && fields[path]) || null);

  const apiKeyField: TextFieldClient = getEntityConfig({
    collectionSlug
  })?.fields?.find(
    (field) => "name" in field && field.name === "apiKey"
  ) as TextFieldClient;

  const validate = (val: string) =>
    text(val, {
      name: "apiKey",
      type: "text",
      blockData: {},
      data: {},
      event: "onChange",
      maxLength: 48,
      minLength: 24,
      path: ["apiKey"],
      preferences: { fields: {} },
      req: {
        payload: {
          config
        },
        t
      } as unknown as PayloadRequest,
      siblingData: {}
    });

  const apiKeyValue = apiKey?.value;

  const apiKeyLabel = useMemo(() => {
    let label: Record<string, string> | string = "API Key";

    if (apiKeyField?.label) {
      label = apiKeyField.label;
    }

    return getTranslation(label, i18n);
  }, [apiKeyField, i18n]);

  const APIKeyLabel = useMemo(
    () => (
      <label className={`${baseClass}__label field-label`} htmlFor="apiKey">
        <span>{apiKeyLabel}</span>
        <CopyToClipboard value={apiKeyValue as string} />
      </label>
    ),
    [apiKeyLabel, apiKeyValue]
  );

  const fieldType = useField({
    path: "apiKey",
    validate
  });

  const highlightField = () => {
    if (highlightedField) {
      setHighlightedField(false);
    }
    setTimeout(() => {
      setHighlightedField(true);
    }, 1);
  };

  const { setValue, value } = fieldType;

  useEffect(() => {
    if (!apiKeyValue && enabled) {
      setValue(initialAPIKey);
    }
    if (!enabled && apiKeyValue) {
      setValue(null);
    }
  }, [apiKeyValue, enabled, setValue, initialAPIKey]);

  useEffect(() => {
    if (highlightedField) {
      setTimeout(() => {
        setHighlightedField(false);
      }, 10000);
    }
  }, [highlightedField]);

  if (!enabled) {
    return null;
  }

  return (
    <Fragment>
      <div
        className={[fieldBaseClass, "api-key", "read-only"]
          .filter(Boolean)
          .join(" ")}
      >
        {APIKeyLabel}
        <div className={`${baseClass}__input-wrap`}>
          <input
            aria-label={apiKeyLabel}
            className={highlightedField ? "highlight" : undefined}
            disabled
            id="apiKey"
            name="apiKey"
            type={showKey ? "text" : "password"}
            value={(value as string) || ""}
          />
          <div className={`${baseClass}__toggle-button-wrap`}>
            <Button
              buttonStyle="none"
              className={`${baseClass}__toggle-button`}
              icon={<EyeIcon active={showKey} />}
              onClick={() => setShowKey((prev) => !prev)}
            />
          </div>
        </div>
      </div>
      {!readOnly && (
        <GenerateConfirmation
          highlightField={highlightField}
          setKey={() => setValue(v7())}
        />
      )}
    </Fragment>
  );
};
