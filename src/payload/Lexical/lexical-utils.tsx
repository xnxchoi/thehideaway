"use client";

import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  RootNode,
  type BaseSelection,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";
import { useCallback, useMemo, useRef } from "react";

export const splitTextAtCaret = (
  textContent: string,
  caretPosition: number
) => {
  if (caretPosition === 0) {
    return { before: "", after: textContent };
  } else if (caretPosition >= textContent.length) {
    return { before: textContent, after: "" };
  } else {
    return {
      before: textContent.substring(0, caretPosition),
      after: textContent.substring(caretPosition)
    };
  }
};
export const caretAtFirst = ({
  root,
  selection
}: {
  selection: BaseSelection | null;
  root: RootNode;
}): boolean => {
  if (!$isRangeSelection(selection)) {
    return false;
  }
  if (root.isEmpty()) {
    return true;
  }
  const firstDesc = root.getFirstDescendant();
  if (!firstDesc) return true;
  return (
    selection.anchor.key === firstDesc.getKey() && selection.anchor.offset === 0
  );
};
export const caretAtLast = ({
  selection,
  root
}: {
  selection: BaseSelection | null;
  root: RootNode;
}): boolean => {
  if (!$isRangeSelection(selection)) return false;

  if (root.isEmpty()) {
    return true;
  }
  const lastDesc = root.getLastDescendant();
  if (!lastDesc) return true;

  return (
    selection.anchor.key === lastDesc.getKey() &&
    selection.anchor.offset === lastDesc.getTextContentSize()
  );
};
export function $isCaretAtStart() {
  const root = $getRoot();
  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  if (root.isEmpty()) {
    return false;
  }
  if (
    selection.anchor.key !== selection.focus.key ||
    selection.anchor.offset !== selection.focus.offset
  ) {
    return false;
  }
  const firstDesc = root.getFirstDescendant();

  if (firstDesc) {
    return (
      selection.anchor.key === firstDesc.getKey() &&
      selection.anchor.offset === 0
    );
  } else {
    const firstChild = root.getFirstChild();
    if (!firstChild) return true;
    return selection.anchor.key === firstChild?.getKey();
  }
}
export function $isCaretAtEnd() {
  const root = $getRoot();

  if (root.isEmpty()) return true;

  const selection = $getSelection();
  if (!$isRangeSelection(selection)) {
    return false;
  }
  if (
    selection.anchor.key !== selection.focus.key ||
    selection.anchor.offset !== selection.focus.offset
  ) {
    return false;
  }
  const lastDesc = root.getLastDescendant();
  if (lastDesc) {
    return (
      selection.anchor.key === lastDesc.getKey() &&
      selection.anchor.offset === lastDesc.getTextContentSize()
    );
  } else {
    const lastChild = root.getLastChild();
    if (!lastChild) return true;
    return selection.anchor.key === lastChild?.getKey();
  }
}
export function $selectEnd() {
  const root = $getRoot();
  const lastDesc = root.getLastDescendant();
  if (lastDesc) {
    lastDesc.selectEnd();
  } else {
    root.selectEnd();
  }
}

export const useKaret = ({ editor }: { editor: LexicalEditor }) => {
  return useMemo(
    () => ({
      isCaretAtStart: () => {
        const root = $getRoot();
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        if (root.isEmpty()) {
          return true;
        }
        const firstDesc = root.getFirstDescendant();
        if (!firstDesc) return true;
        return (
          selection.anchor.key === firstDesc.getKey() &&
          selection.anchor.offset === 0
        );
      },
      isCaretAtEnd: () => {
        const root = $getRoot();

        if (root.isEmpty()) return true;
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
          return false;
        }
        const lastDesc = root.getLastDescendant();
        if (!lastDesc) return true;

        return (
          selection.anchor.key === lastDesc.getKey() &&
          selection.anchor.offset === lastDesc.getTextContentSize()
        );
      },
      moveCaretToStart: () => {
        try {
          const root = $getRoot();
          const firstDesc = root.getFirstDescendant();
          if (!firstDesc) {
            const firstChild = root.getFirstChild();
            if (firstChild) {
              firstChild.selectStart();
            }
            return;
          }
          firstDesc.selectStart();
        } catch (e) {
          console.error(e);
        }
      },
      moveCaretToEnd: () => {
        const root = $getRoot();
        const lastDesc = root.getLastDescendant();
        if (lastDesc) {
          lastDesc.selectEnd();
          return;
        }
        const lastChild = root.getLastChild();
        if (lastChild) {
          lastChild.selectEnd();
        }
        return;
      }
    }),
    [editor]
  );
};
export const $isFocusInEditor = (editor: LexicalEditor) => {
  const activeElement = document.activeElement;
  const rootEl = editor.getRootElement();
  if (!rootEl) {
    console.error("Root element for content lexical not found... why...");
    return false;
  }
  if (activeElement && !rootEl.contains(activeElement)) {
    // We're focused on some other element (input, select, etc.) - don't interfere
    return false;
  }
  return true;
};
