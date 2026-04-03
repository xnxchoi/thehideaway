"use client";

import { TextFieldClientComponent, TextFieldClientProps } from "payload";
import { useField, useOperation } from "@payloadcms/ui";
import { EditorState } from "@payloadcms/richtext-lexical/lexical";

export const ClientField = ({
  path,
  permissions,
  editorToWatch
}: TextFieldClientProps & {
  editorToWatch: string;
}) => {
  const operation = useOperation();
  const { value, setValue } = useField({
    path
  });
  const { value: editorValue } = useField<EditorState>({ path: editorToWatch });
};
