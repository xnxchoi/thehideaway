"use client";
import React, { useCallback, useState, type FC, type ReactNode } from "react";
import { CollapsibleProvider, useCollapsible } from "./provider";
import {
  AnimateHeight,
  useTranslation,
  DragHandleIcon,
  ChevronIcon
} from "@payloadcms/ui";
import type { DragHandleProps } from "node_modules/@payloadcms/ui/dist/elements/DraggableSortable/DraggableSortableItem/types";

const baseClass = "collapsible";

export { CollapsibleProvider, useCollapsible };

export type CollapsibleProps = {
  actions?: ReactNode;
  /**
   * Components that will be rendered within the collapsible provider but after the wrapper.
   */
  AfterCollapsible?: ReactNode;
  children: ReactNode;
  className?: string;
  collapsibleStyle?: "default" | "error";
  /**
   * If set to true, clicking on the collapsible header will not toggle the collapsible state.
   * This is useful if the collapsible state is controlled externally (e.g. from a parent component or custom button).
   */
  disableHeaderToggle?: boolean;
  /**
   * If set to true, the toggle indicator (chevron) on the right side of the header will be hidden.
   */
  disableToggleIndicator?: boolean;
  dragHandleProps?: DragHandleProps;
  header?: ReactNode;
  initCollapsed?: boolean;
  isCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => Promise<void> | void;
};

export const Collapsible: FC<CollapsibleProps> = ({
  actions,
  AfterCollapsible,
  children,
  className,
  collapsibleStyle = "default",
  disableHeaderToggle = false,
  disableToggleIndicator = false,
  dragHandleProps,
  header,
  initCollapsed,
  isCollapsed: collapsedFromProps,
  onToggle
}) => {
  const [collapsedLocal, setCollapsedLocal] = useState(Boolean(initCollapsed));
  const [hoveringToggle, setHoveringToggle] = useState(false);
  const { isWithinCollapsible } = useCollapsible();
  const { t } = useTranslation();

  const isCollapsed =
    typeof collapsedFromProps === "boolean"
      ? collapsedFromProps
      : collapsedLocal;

  const toggleCollapsible = useCallback(() => {
    if (typeof onToggle === "function") {
      void onToggle(!isCollapsed);
    }
    setCollapsedLocal(!isCollapsed);
  }, [onToggle, isCollapsed]);

  return (
    <div
      className={[
        baseClass,
        className,
        dragHandleProps && `${baseClass}--has-drag-handle`,
        isCollapsed && `${baseClass}--collapsed`,
        isWithinCollapsible && `${baseClass}--nested`,
        hoveringToggle && !disableHeaderToggle && `${baseClass}--hovered`,
        `${baseClass}--style-${collapsibleStyle}`
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <CollapsibleProvider isCollapsed={isCollapsed} toggle={toggleCollapsible}>
        <div
          className={`${baseClass}__toggle-wrap${disableHeaderToggle ? "toggle-disabled" : ""}`}
          onMouseEnter={() => setHoveringToggle(true)}
          onMouseLeave={() => setHoveringToggle(false)}
        >
          {!disableHeaderToggle && (
            <button
              className={[
                `${baseClass}__toggle`,
                `${baseClass}__toggle--${isCollapsed ? "collapsed" : "open"}`
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={toggleCollapsible}
              type="button"
            >
              <span>{t("fields:toggleBlock")}</span>
            </button>
          )}

          {dragHandleProps && (
            <div
              className={`${baseClass}__drag`}
              {...dragHandleProps.attributes}
              {...dragHandleProps.listeners}
            >
              <DragHandleIcon />
            </div>
          )}
          {header ? (
            <div
              className={[
                `${baseClass}__header-wrap`,
                dragHandleProps && `${baseClass}__header-wrap--has-drag-handle`
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {header}
            </div>
          ) : null}
          <div className={`${baseClass}__actions-wrap`}>
            {actions ? (
              <div className={`${baseClass}__actions`}>{actions}</div>
            ) : null}
            {!disableToggleIndicator && (
              <div className={`${baseClass}__indicator`}>
                <ChevronIcon direction={!isCollapsed ? "up" : undefined} />
              </div>
            )}
          </div>
        </div>
        <AnimateHeight height={isCollapsed ? 0 : "auto"}>
          <div className={`${baseClass}__content`}>{children}</div>
        </AnimateHeight>
        {AfterCollapsible}
      </CollapsibleProvider>
    </div>
  );
};
