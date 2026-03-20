import { MotionPillButton } from "@/components/UX/Button";
import { cn } from "@/lib/utils";
import { createFormHook } from "@tanstack/react-form";
import { HTMLMotionProps } from "motion/react";
import { lazy, ReactNode } from "react";
import { fieldContext, formContext, useFormContext } from "./form-context";

const TextField = lazy(() => import("@/components/UX/Tour/Fields/text-field"));
const TextArea = lazy(() => import("@/components/UX/Tour/Fields/text-area"));
function SubscribeButton({
  children,
  disabled,
  onClick: handleNext
}: Omit<HTMLMotionProps<"button">, "children"> & { children: ReactNode }) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <MotionPillButton
          onClick={handleNext}
          disabled={disabled || isSubmitting}
          className={cn(
            "rounded-full px-7 py-3 text-[14px] font-medium",
            "bg-foreground text-background",
            "hover:bg-foreground/90 active:scale-[0.97]",
            "transition-all duration-150",
            "disabled:opacity-25 disabled:active:scale-100",
            "min-w-[140px] text-center"
          )}
        >
          {children}
        </MotionPillButton>
      )}
    </form.Subscribe>
  );
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldComponents: { TextArea, TextField },
  formComponents: {
    SubscribeButton
  },
  fieldContext,
  formContext
});
