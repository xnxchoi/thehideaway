import {
  SerializedParagraphNode,
  SerializedRootNode,
  SerializedTextNode,
  type SerializedEditorState
} from "lexical";

export const createRichtext = (content: string | Array<string>) => {
  const root = {
    type: "root",
    format: "",
    indent: 0,
    direction: "ltr" as const,
    version: 1,
    children: [] as (SerializedParagraphNode | SerializedTextNode)[]
  } as SerializedRootNode;
  const textContent = ((Array.isArray(content) && content) || [content]).map(
    (item) => {
      return {
        type: "paragraph",
        format: "justify",
        indent: 0,
        textStyle: "",
        textFormat: 0,
        version: 1,
        children: [
          {
            mode: "normal",
            text: item,
            type: "text",
            style: "",
            detail: 0,
            format: 2,
            version: 1
          }
        ] as SerializedTextNode[],
        direction: "ltr"
      } satisfies SerializedParagraphNode;
    }
  );
  root.children = textContent;
  return { root };
};

export const createEditorState = (
  content: string | Array<string>
): SerializedEditorState => {
  const root = {
    type: "root",
    format: "",
    indent: 0,
    direction: "ltr" as const,
    version: 1,
    children: [] as (SerializedParagraphNode | SerializedTextNode)[]
  } as SerializedRootNode;
  const textContent = ((Array.isArray(content) && content) || [content]).map(
    (item) => {
      return {
        type: "paragraph",
        format: "justify",
        indent: 0,
        textStyle: "",
        textFormat: 0,
        version: 1,
        children: [
          {
            mode: "normal",
            text: item,
            type: "text",
            style: "",
            detail: 0,
            format: 2,
            version: 1
          }
        ] as SerializedTextNode[],
        direction: "ltr"
      } satisfies SerializedParagraphNode;
    }
  );
  root.children = textContent;
  return { root };
};
