import type { CursorStatus } from "@/components/core/cursorWrapper";
import { ElementType, ReactNode, RefObject } from "react";

type secondaryAction = {
  label: string;
  onClick: (event: MouseEvent) => void;
};

export type Props = {
  "aria-label"?: string;
  buttonId?: string;
  buttonStyle?:
    | "error"
    | "icon-label"
    | "none"
    | "pill"
    | "primary"
    | "secondary"
    | "subtle"
    | "tab"
    | "transparent";
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  el?: "anchor" | "link" | ElementType;
  /**
   * Setting to `true` will allow the submenu to be opened when the button is disabled
   */
  enableSubMenu?: boolean;
  icon?: ["chevron" | "edit" | "plus" | "x"] | ReactNode;
  iconPosition?: "left" | "right";
  iconStyle?: "none" | "with-border" | "without-border";
  id?: string;
  /**
   * @deprecated
   * This prop is deprecated and will be removed in the next major version.
   * Components now import their own `Link` directly from `next/link`.
   */
  Link?: ElementType;
  margin?: boolean;
  newTab?: boolean;

  /**
   * Enables form submission via an onClick handler. This is only needed if
   * type="submit" does not trigger form submission, e.g. if the button DOM
   * element is not a direct child of the form element.
   *
   * @default false
   */
  programmaticSubmit?: boolean;
  ref?: RefObject<HTMLAnchorElement | HTMLButtonElement | null>;
  round?: boolean;
  size?: "large" | "medium" | "small";
  SubMenuPopupContent?: (props: { close: () => void }) => ReactNode;
  to?: string;
  tooltip?: string;
  type?: "button" | "submit";
  url?: string;
} & {
  overrides?: {
    onEnter?: { condition: (e: any) => CursorStatus };
    onLeave?: { condition: (e: any) => CursorStatus };
  };
};
