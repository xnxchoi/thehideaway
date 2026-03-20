import { useFieldContext } from "@/components/UX/Tour/form-context";
import { cn } from "@/lib/utils";
import * as m from "motion/react-m";
export default function TextArea({
  className,
  maxLength = 200,
  placeholder = "Your passion, work, interests — keep it interesting."
}: {
  className?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  const field = useFieldContext<string>();

  return (
    <>
      <m.textarea
        className={cn(
          "w-full rounded-2xl border border-foreground/15 bg-transparent px-5 py-4",
          "text-[15px] text-foreground placeholder:text-muted-foreground/35",
          "transition-colors duration-150 focus:border-foreground/45 focus:outline-none",
          "min-h-[112px] resize-none leading-relaxed",
          className
        )}
        placeholder={placeholder}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        maxLength={maxLength}
      />
      <span className="text-right text-xs text-muted-foreground/35 tabular-nums">
        {field.state.value.length}/{maxLength}
      </span>
    </>
  );
}
