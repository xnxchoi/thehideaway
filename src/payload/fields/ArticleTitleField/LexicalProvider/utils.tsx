"use client";

import {
  $getRoot,
  type LexicalEditor
} from "@payloadcms/richtext-lexical/lexical";

export function isOnHandleElement(
  element: HTMLElement,
  handleElementClassName: string
): boolean {
  return !!element.closest(`.${handleElementClassName}`);
}
export function setHandlePosition(
  targetElem: HTMLElement | null,
  handleElem: HTMLElement,
  anchorElem: HTMLElement,
  leftOffset: number = 0 // SPACE
) {
  if (!targetElem) {
    handleElem.style.opacity = "0";
    handleElem.style.transform = "translate(-10000px, -10000px)";
    return;
  }

  const targetRect = targetElem.getBoundingClientRect();
  const targetStyle = window.getComputedStyle(targetElem);
  const floatingElemRect = handleElem.getBoundingClientRect();
  const anchorElementRect = anchorElem.getBoundingClientRect();

  let top: number;

  const isBlockStyle = [
    "lexical-block",
    "lexical-upload",
    "lexical-relationship"
  ].some((classes) =>
    targetElem.firstElementChild?.classList.contains(classes)
  );

  if (!isBlockStyle) {
    // No need to let line height affect the re-positioning of the floating element if line height has no
    // visual effect on the element. Otherwise, the floating element will be positioned incorrectly.
    const actualLineHeight = doesLineHeightAffectElement(targetElem)
      ? parseInt(targetStyle.lineHeight, 10)
      : 0;

    top =
      targetRect.top +
      (actualLineHeight - floatingElemRect.height) / 2 -
      anchorElementRect.top;
  } else {
    top = targetRect.top + 8 - anchorElementRect.top;
  }

  const left = leftOffset;

  handleElem.style.opacity = "1";
  handleElem.style.transform = `translate(${left}px, ${top}px)`;
}
const replacedElements = [
  "IMG",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "BUTTON",
  "VIDEO",
  "OBJECT",
  "EMBED",
  "IFRAME",
  "HR"
];

/**
 * From ChatGPT, only that verified it works for HR elements.
 *
 * HTML Elements can have CSS lineHeight applied to them, but it doesn't always affect the visual layout.
 * This function checks if the line-height property has an effect on the element's layout.
 * @param htmlElem
 */
export function doesLineHeightAffectElement(htmlElem: HTMLElement) {
  if (!htmlElem) {
    return false;
  }

  // Check for replaced elements, elements that typically don't support line-height adjustments,
  // and elements without visible content

  if (
    replacedElements.includes(htmlElem.tagName) ||
    htmlElem.offsetHeight === 0 ||
    htmlElem.offsetWidth === 0
  ) {
    return false;
  }

  // Check for specific CSS properties that negate line-height's visual effects
  const style = window.getComputedStyle(htmlElem);
  if (
    style.display === "table-cell" ||
    style.position === "absolute" ||
    style.visibility === "hidden" ||
    style.opacity === "0"
  ) {
    return false;
  }

  // This is a basic check, and there can be more complex scenarios where line-height doesn't have an effect.
  return true;
}

export function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}
/**
 * Calculate distance between scrollerElem and target if target is not in scrollerElem
 */
export const calculateDistanceFromScrollerElem = (
  scrollerElem: HTMLElement | null,
  pageX: number,
  pageY: number,
  target: HTMLElement,
  horizontalBuffer: number = 50,
  verticalBuffer: number = 25
): number => {
  let distanceFromScrollerElem = 0;
  if (scrollerElem && !scrollerElem.contains(target)) {
    const { bottom, left, right, top } = scrollerElem.getBoundingClientRect();

    const adjustedTop = top + window.scrollY;
    const adjustedBottom = bottom + window.scrollY;

    if (
      pageY < adjustedTop - verticalBuffer ||
      pageY > adjustedBottom + verticalBuffer ||
      pageX < left - horizontalBuffer ||
      pageX > right + horizontalBuffer
    ) {
      return -1;
    }

    // This is used to allow the _draggableBlockElem to be found when the mouse is in the
    // buffer zone around the scrollerElem.
    if (pageX < left || pageX > right) {
      distanceFromScrollerElem = pageX < left ? pageX - left : pageX - right;
    }
  }
  return distanceFromScrollerElem;
};
