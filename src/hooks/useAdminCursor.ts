import { useCursor } from "@/providers/RP_Pro";
import { useEffect } from "react";

const INTERACTIVE_ELEMENTS_SELECTOR = [
  "a",
  "button",
  'input[type="button"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  'input[type="range"]',
  '[role="button"]',
  '[role="link"]',
  // You can add a custom attribute to any other element to make it interactive
  '[data-interactive="true"]'
].join(", ");

export const useAdminCursor = () => {
  const setCursorState = useCursor((s) => s.setCursorState);

  useEffect(() => {
    const handleMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const interactiveElement = target.closest(INTERACTIVE_ELEMENTS_SELECTOR);

      if (interactiveElement) {
        const isDisabled =
          interactiveElement.hasAttribute("disabled") ||
          (interactiveElement.tagName === "INPUT" &&
            (interactiveElement as HTMLInputElement).readOnly) ||
          interactiveElement.getAttribute("aria-disabled") === "true";

        if (isDisabled) {
          setCursorState(null);
        } else {
          setCursorState("FOCUS");
        }
      } else {
        // If not hovering over an interactive element, reset cursor
        setCursorState(null);
      }
    };

    // We only need one listener on the document for mouseout
    const handleMouseOut = () => {
      setCursorState(null);
    };

    document.addEventListener("mouseover", handleMouseOver);
    document.addEventListener("mouseout", handleMouseOut);

    return () => {
      document.removeEventListener("mouseover", handleMouseOver);
      document.removeEventListener("mouseout", handleMouseOut);
    };
  }, [setCursorState]);
};
