"use client";

import {
  $getRoot,
  $getSelection,
  $isRangeSelection
} from "@payloadcms/richtext-lexical/lexical";

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
