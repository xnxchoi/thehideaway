"use client";
import type {
  CheckboxFieldClientComponent,
  CheckboxFieldClientProps,
  CheckboxFieldValidation,
  Validate
} from "payload";

import React, { useCallback, useMemo } from "react";

import type { CheckboxInputProps } from "./CheckboxInput";

import { RenderCustomComponent } from "@payloadcms/ui";
import { FieldDescription } from "@payloadcms/ui";
import { FieldError } from "@payloadcms/ui";
import { useForm } from "@payloadcms/ui";
import { useField } from "@payloadcms/ui";
import { withCondition } from "@payloadcms/ui";
import { useEditDepth } from "@payloadcms/ui";
import { generateFieldID } from "@payloadcms/ui/utilities/generateFieldID";

import { fieldBaseClass } from "@payloadcms/ui/fields/shared";
import { CheckboxInput } from "./CheckboxInput";

import { mergeFieldStyles } from "node_modules/@payloadcms/ui/dist/fields/mergeFieldStyles";

const baseClass = "checkbox";

export { CheckboxFieldClientProps, CheckboxInput, type CheckboxInputProps };

const CheckboxFieldComponent: CheckboxFieldClientComponent = (props) => {
  const {
    id,
    checked: checkedFromProps,
    disableFormData,
    field,
    field: {
      name,
      admin: {
        /** @ts-expect-error payload shit */
        className,
        /** @ts-expect-error payload shit */
        description
      } = {} as CheckboxFieldClientProps["field"]["admin"],
      label,
      required
    } = {} as CheckboxFieldClientProps["field"],
    onChange: onChangeFromProps,
    partialChecked,
    path: pathFromProps,
    readOnly,
    validate
  } = props;

  const { uuid } = useForm();

  const editDepth = useEditDepth();
  /** @ts-expect-error payload shit */
  const memoizedValidate: Validate = useCallback(
    (value, options) => {
      if (typeof validate === "function") {
        return validate(value, {
          ...options,
          required,
          type: "checkbox",
          name: name
        });
      }
    },
    [validate, required, name]
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
    path,
    setValue,
    showError,
    value
  } = useField({
    disableFormData,
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });

  const onToggle = useCallback(() => {
    if (!readOnly) {
      setValue(!value);
      if (typeof onChangeFromProps === "function") {
        onChangeFromProps(!value);
      }
    }
  }, [onChangeFromProps, readOnly, setValue, value]);

  const checked = checkedFromProps || Boolean(value);
  /** @ts-expect-error payload shit */
  const fieldID = id || generateFieldID(path, editDepth, uuid);

  const styles = useMemo(() => mergeFieldStyles(field), [field]);

  return (
    <div
      className={[
        fieldBaseClass,
        baseClass,
        showError && "error",
        className,
        value && `${baseClass}--checked`,
        (readOnly || disabled) && `${baseClass}--read-only`
      ]
        .filter(Boolean)
        .join(" ")}
      style={styles}
    >
      <RenderCustomComponent
        CustomComponent={Error}
        Fallback={<FieldError path={path} showError={showError} />}
      />
      <CheckboxInput
        AfterInput={AfterInput}
        BeforeInput={BeforeInput}
        checked={checked}
        id={fieldID}
        /** @ts-expect-error payload shit */
        inputRef={null}
        Label={Label}
        label={label}
        name={path}
        onToggle={onToggle}
        partialChecked={partialChecked}
        readOnly={readOnly || disabled}
        required={required}
      />
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={<FieldDescription description={description} path={path} />}
      />
    </div>
  );
};

export const CheckboxField = withCondition(CheckboxFieldComponent);
