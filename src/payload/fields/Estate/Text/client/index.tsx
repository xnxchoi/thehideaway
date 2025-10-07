"use client";

import { useField } from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import { useCallback, useEffect, useRef, type ChangeEventHandler } from "react";
import { RP_TextInput } from "./inputField";

export function ClientTextField(props: TextFieldClientProps) {
  const {
    field,
    readOnly,
    inputRef,
    path,
    permissions,
    schemaPath,
    onKeyDown,

    forceRender,
    validate,
    renderedBlocks
  } = props;
  const { value, setValue } = useField<string>({ path: path || field.name });
  const readOnlyRef = useRef(readOnly);
  useEffect(() => {
    readOnlyRef.current = readOnly;
  }, [readOnly]);
  const onChangeHandler: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (
        !readOnlyRef.current &&
        (e.currentTarget as HTMLInputElement).disabled !== true
      ) {
        setValue(e.currentTarget.value);
      }
    },
    [setValue]
  );
  return (
    <RP_TextInput
      onChange={onChangeHandler}
      value={value}
      field={field}
      path={path}
      readOnly={readOnly}
      ref={inputRef}
      onKeyDown={onKeyDown}
      forceRender={forceRender}
      validate={validate}
      renderedBlocks={renderedBlocks}
      permissions={permissions}
      schemaPath={schemaPath}
    />
  );
}
