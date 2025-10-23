"use client";
import type { StaticLabel } from "payload";

import React, { useCallback } from "react";

import { RenderCustomComponent } from "@payloadcms/ui";
import { FieldLabel } from "@payloadcms/ui";

import { CheckIcon, DividerVerticalIcon } from "@radix-ui/react-icons";
import { useCursor } from "@/providers/RP_Pro";

export type CheckboxInputProps = {
  readonly AfterInput?: React.ReactNode;
  readonly BeforeInput?: React.ReactNode;
  readonly checked?: boolean;
  readonly className?: string;
  readonly id?: string;
  readonly inputRef?: React.RefObject<HTMLInputElement | null>;
  readonly Label?: React.ReactNode;
  readonly label?: StaticLabel;
  readonly localized?: boolean;
  readonly name?: string;
  readonly onToggle: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly partialChecked?: boolean;
  readonly readOnly?: boolean;
  readonly required?: boolean;
};

export const inputBaseClass = "checkbox-input";

export const CheckboxInput: React.FC<CheckboxInputProps> = ({
  id,
  name,
  AfterInput,
  BeforeInput,
  checked,
  className,
  inputRef,
  Label,
  label,
  localized,
  onToggle,
  partialChecked,
  readOnly,
  required
}) => {
  const setCursor = useCursor((r) => r.setCursorState);

  return (
    <div
      className={[
        className,
        inputBaseClass,
        checked && `${inputBaseClass}--checked`,
        readOnly && `${inputBaseClass}--read-only`
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`${inputBaseClass}__input`}>
        {BeforeInput}
        <input
          onMouseEnter={() => {
            setCursor(readOnly ? null : "FOCUS");
          }}
          onMouseLeave={() => {
            setCursor(null);
          }}
          aria-label=""
          defaultChecked={Boolean(checked)}
          disabled={readOnly}
          id={id}
          name={name}
          onInput={onToggle}
          ref={inputRef}
          required={required}
          type="checkbox"
        />
        <span
          className={[
            `${inputBaseClass}__icon`,
            !checked && partialChecked ? "partial" : "check"
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {checked && <CheckIcon />}
          {!checked && partialChecked && <DividerVerticalIcon />}
        </span>
        {AfterInput}
      </div>
      <RenderCustomComponent
        CustomComponent={Label}
        Fallback={
          <FieldLabel
            htmlFor={id}
            label={label}
            localized={localized}
            required={required}
          />
        }
      />
    </div>
  );
};
