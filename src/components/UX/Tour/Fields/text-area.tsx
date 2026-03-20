import { useFieldContext } from "@/components/UX/Tour/form-context";

export default function TextArea() {
  const field = useFieldContext<string>();

  return (
    <>
      <textarea
        className={
          "w-full rounded-2xl border border-foreground/15 bg-transparent px-5 py-4 " +
          "text-[15px] text-foreground placeholder:text-muted-foreground/35 " +
          "transition-colors duration-150 focus:border-foreground/45 focus:outline-none " +
          "min-h-[112px] resize-none leading-relaxed"
        }
        placeholder="Your passion, work, interests — keep it interesting."
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        maxLength={200}
      />
      <span className="text-right text-xs text-muted-foreground/35 tabular-nums">
        {field.state.value.length}/200
      </span>
    </>
  );
}
