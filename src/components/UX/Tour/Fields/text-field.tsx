import { useFieldContext } from "@/components/UX/Tour/form-context";
import { cn } from "@/lib/utils";
import { HTMLMotionProps } from "motion/react";
import * as m from "motion/react-m";
export default function TextField({
  placeholder,
  className,
  autoComplete,
  ...props
}: Omit<HTMLMotionProps<"input">, "value" | "onBlur" | "onChange">) {
  const field = useFieldContext<string>();

  return (
    <m.input
      className={cn(
        "w-full rounded-full border border-foreground/15 bg-transparent px-5 py-3.5",
        "text-[15px] text-foreground placeholder:text-muted-foreground/35",
        "transition-colors duration-150 focus:border-foreground/45 focus:outline-none",
        "autofill:bg-transparent",
        className
      )}
      placeholder={placeholder}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
      autoComplete={autoComplete}
      {...props}
    />
  );
}
