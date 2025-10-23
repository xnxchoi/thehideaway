"use client";
import type { ArticleCoverProps } from "./coverClient";
import { BulkUploadProvider, useConfig } from "@payloadcms/ui";
import { useField } from "@payloadcms/ui";
import React, { useCallback } from "react";
import { CoverImageClient } from "./coverClient";
import type { ImageBaseSelect } from "@/types/payload-api-helpers";

export const Middle = (props: ArticleCoverProps) => {
  const {
    field,
    field: {
      admin: { allowCreate, className, description, isSortable } = {},
      hasMany,
      label,
      localized,
      maxRows,
      relationTo,
      required
    },
    path: pathFromProps,
    readOnly,
    validate
  } = props;

  const { config } = useConfig();
  const memoizedValidate = useCallback(
    (value: string, options: any) => {
      if (typeof validate === "function") {
        return validate(value, { ...options, required });
      }
      return true;
    },
    [validate, required]
  );

  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled,
    filterOptions,
    path,
    showError,
    value
  } = useField<string | ImageBaseSelect>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });

  return (
    <BulkUploadProvider>
      <CoverImageClient {...props} path={path} />
    </BulkUploadProvider>
  );
};
