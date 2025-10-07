import { cn } from "@/lib/utils";
import type { TextFieldClientProps } from "payload";
import type { ChangeEventHandler, ComponentPropsWithRef } from "react";
type RP_TextInputProps = ComponentPropsWithRef<"input"> &
  TextFieldClientProps & {
    onChange: ChangeEventHandler;
  };
export function RP_TextInput(props: RP_TextInputProps) {
  const { readOnly, onChange, className, value } = props;
  return (
    <input
      className={cn(className, "text-base")}
      type="text"
      readOnly={readOnly}
      value={value}
      onChange={onChange}
    />
  );
}
