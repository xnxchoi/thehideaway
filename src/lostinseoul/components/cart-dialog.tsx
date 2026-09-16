"use client";

import {
  FloatingFocusManager,
  useDismiss,
  useFloating,
  useInteractions
} from "@floating-ui/react";
import { useTranslations } from "next-intl";
import type { HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";

export function CartDialog({
  active,
  onClose,
  children,
  ...props
}: HTMLMotionProps<"div"> & { active: boolean; onClose: () => void }) {
  const t = useTranslations("LOSTINSEOUL.cart");
  const { context, refs } = useFloating({
    open: active,
    onOpenChange: (open) => {
      if (!open) onClose();
    }
  });
  const dismiss = useDismiss(context, { outsidePress: false });
  const { getFloatingProps } = useInteractions([dismiss]);
  return (
    <FloatingFocusManager
      context={context}
      disabled={!active}
      initialFocus={refs.floating}
      returnFocus
      restoreFocus
      outsideElementsInert
    >
      <m.div
        {...props}
        {...getFloatingProps()}
        ref={refs.setFloating}
        role="dialog"
        aria-modal={active ? "true" : undefined}
        aria-hidden={!active || undefined}
        inert={!active}
        aria-label={t("title")}
        tabIndex={-1}
      >
        {children}
      </m.div>
    </FloatingFocusManager>
  );
}
