"use client";
import { useCursor } from "@/providers/RP_Pro";
import {
  Button as Buton,
  ChevronIcon,
  EditIcon,
  LinkIcon,
  PlusIcon,
  SwapIcon,
  Tooltip,
  XIcon
} from "@payloadcms/ui";
import {
  Fragment,
  isValidElement,
  MouseEventHandler,
  useCallback
} from "react";
import type { Props } from "@/payload/elements/Button/types";

const baseClass = "btn";

const icons = {
  chevron: ChevronIcon,
  edit: EditIcon,
  link: LinkIcon,
  plus: PlusIcon,
  swap: SwapIcon,
  x: XIcon
};
export const ButtonContents = ({ children, icon, showTooltip, tooltip }) => {
  const BuiltInIcon = icons[icon];

  return (
    <Fragment>
      {tooltip && (
        <Tooltip className={`${baseClass}__tooltip`} show={showTooltip}>
          {tooltip}
        </Tooltip>
      )}
      <span className={`${baseClass}__content`}>
        {children && <span className={`${baseClass}__label`}>{children}</span>}
        {icon && (
          <span className={`${baseClass}__icon`}>
            {isValidElement(icon) && icon}
            {BuiltInIcon && <BuiltInIcon />}
          </span>
        )}
      </span>
    </Fragment>
  );
};
type secondaryAction = {
  label: string;
  onClick: (event) => void;
};

export const Hutton = ({ children, className, overrides, ...props }: Props) => {
  const onHover: MouseEventHandler = useCallback(
    (e) => {
      if (overrides?.onEnter?.condition) {
        setCursorState(overrides.onEnter.condition(e));
      } else {
        setCursorState("FOCUS");
      }
    },
    [overrides]
  );
  const onLeave: MouseEventHandler = useCallback(
    (e) => {
      if (overrides?.onLeave?.condition) {
        setCursorState(overrides.onLeave.condition(e));
      } else {
        setCursorState(null);
      }
    },
    [overrides]
  );
  const setCursorState = useCursor((l) => l.setCursorState);
  return (
    <div onMouseEnter={onHover} onMouseLeave={onLeave}>
      <Buton className={className} {...props}>
        {children}
      </Buton>
    </div>
  );
};
export const Button = Hutton;
