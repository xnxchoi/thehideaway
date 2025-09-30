"use client";

import "./index.scss";

import {
  Button,
  TextInput,
  useDocumentInfo,
  useField,
  useForm,
  useFormFields
} from "@payloadcms/ui";
import type { TextFieldClientProps } from "payload";
import React, {
  useCallback,
  useEffect,
  useState,
  type MouseEventHandler
} from "react";
import { formatSlug } from "./formatSlug";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { LockClosedIcon, LockOpen2Icon } from "@radix-ui/react-icons";
import { useCursorStore } from "@/providers/RP_Pro";

type SlugComponentProps = {
  fieldToUse: string;
  checkboxFieldPath: string;
} & TextFieldClientProps;

export const SlugComponent = ({
  field,
  fieldToUse,
  checkboxFieldPath: checkboxFieldPathFromProps,
  path,

  readOnly: readOnlyFromProps
}: SlugComponentProps) => {
  const { label } = field;
  const checkboxFieldPath = path?.includes(".")
    ? `${path}.${checkboxFieldPathFromProps}`
    : checkboxFieldPathFromProps;
  const { value, setValue } = useField<string>({ path: path || field.name });

  const { dispatchFields } = useForm();

  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as string;
  });

  const targetFieldValue = useFormFields(([fields]) => {
    return fields[fieldToUse]?.value as string;
  });

  const hash = useFormFields(([field]) => {
    return field["hashId"]?.value as string;
  });

  // const { onMouseEnter, onMouseLeave } = useDomCursor({})
  useEffect(() => {}, []);
  const [ghostValue, setGhostValue] = useState("");
  const [ghostSize, setGhostSize] = useState(0);
  useEffect(() => {
    const ghost =
      (value && value.length > 0 && hash.length > 0 && `-${hash}`) || "";
    setGhostValue(ghost);
    setGhostSize(ghost.length + 1);
  }, [hash, value]);

  useEffect(() => {
    if (checkboxValue) {
      if (targetFieldValue) {
        const formattedSlug = formatSlug(targetFieldValue);

        setValue(formattedSlug);
      } else {
        setValue("");
      }
    }
  }, [targetFieldValue, checkboxValue, setValue, value]);

  const handleLock: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault();

      dispatchFields({
        type: "UPDATE",
        path: checkboxFieldPath,
        value: !checkboxValue
      });
    },
    [checkboxValue, checkboxFieldPath, dispatchFields]
  );
  const setCursor = useCursorStore((l) => l.setCursorState);
  const onMouseEnter = useCallback(() => {
    setCursor("FOCUS");
  }, [setCursor]);
  const onMouseLeave = useCallback(() => {
    setCursor(null);
  }, [setCursor]);

  const readOnly = readOnlyFromProps || checkboxValue;

  return (
    <div className="field-type slug-field-component relative">
      <div className="flex w-full items-center justify-start gap-2">
        <label htmlFor={`field-${path}`} className="text-muted-foreground">
          Slug :{" "}
        </label>
        <div
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="flex"
        >
          <Button
            className="flex items-center justify-center gap-2"
            buttonStyle="none"
            onClick={handleLock}
          >
            {checkboxValue ? (
              <LockClosedIcon className="h-4 w-4" />
            ) : (
              <LockOpen2Icon className="h-4 w-4" />
            )}
            {checkboxValue ? "Auto" : "Manual"}
          </Button>
        </div>
      </div>
      <div className="relative">
        <TextInput
          value={value}
          onChange={setValue}
          BeforeInput={
            <style>{`  
            input:not(.ghost):not([disabled]):not([readOnly=true]){
              font-family: var(--font-mono);
              background: transparent;
              z-index: 10;
              position: relative;
            }
            input::placeholder{
              background: transparent;
              font-family: var(--font-mono);
            }
          `}</style>
          }
          AfterInput={
            <div className="absolute top-0 right-0 left-0 flex h-full w-full bg-transparent">
              <span
                className="ghost -z-[1] border-transparent text-foreground opacity-0 transition-all duration-300 ease-power4"
                style={{
                  fontFamily: "var(--font-mono)",
                  background: "transparent",
                  flexGrow: 0,
                  borderColor: "transparent",
                  flexShrink: 0,
                  width: "fit-content",
                  paddingRight: 0,
                  boxShadow: "none"
                }}
              >
                {" "}
                {value}
              </span>
              <Tooltip>
                <div
                  className="group -z-[1] opacity-0 transition-all duration-300 ease-power4 data-[active=false]:z-[10] data-[active=false]:opacity-100"
                  data-active={checkboxValue}
                  // onMouseEnter={() => setCursor("FOCUS")}
                  // onMouseLeave={() => setCursor(null)}
                >
                  <TooltipTrigger asChild>
                    <input
                      value={ghostValue}
                      type="text"
                      onChange={(e) => setGhostValue(e.target.value)}
                      size={ghostSize}
                      className="ghost -z-[1] border-transparent text-[oklch(var(--muted-faded-fg)/.5)] transition-all duration-300 ease-power4 group-hover:text-foreground"
                      style={{
                        boxShadow: "none",
                        fontFamily: "var(--font-mono)",
                        background: "transparent",
                        borderColor: "transparent",
                        paddingLeft: 0,
                        flex: "1 1 0%"
                      }}
                      data-active={checkboxValue}
                      readOnly={true}
                    />
                  </TooltipTrigger>
                  <TooltipContent
                    sideOffset={-10}
                    align={"start"}
                    alignOffset={5}
                  >
                    <div
                      className={
                        "m-0 block border-none bg-transparent p-0 text-foreground"
                      }
                    >
                      A{" "}
                      <span className="text-warm-beige">unique identifier</span>
                      <span> for this post.</span>
                    </div>
                  </TooltipContent>
                </div>
              </Tooltip>
            </div>
          }
          path={path || field.name}
          style={{
            background: "transparent",
            fontFamily: "var(--font-mono)"
          }}
          readOnly={Boolean(readOnly)}
        />
      </div>
    </div>
  );
};
