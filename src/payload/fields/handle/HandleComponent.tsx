"use client";
import "./index.scss";
import { ensureHandleIsUnique } from "@/payload/collections/Users/endpoints/ensureHandleIsUnique";
import { ensureUniqueHandle } from "@/payload/fields/handle/ensureUniqueHandle";
import { DateTime } from "luxon";
import { useMotionValue } from "motion/react";
import { Operation, TextFieldClientProps } from "payload";
import type { ChangeEvent, FocusEvent, FC } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useField } from "@payloadcms/ui";
import {
  formatUserHandle,
  formatUserHandleLite,
  HANDLE_TEST_REGEX
} from "@/payload/fields/handle/formatUserHandle";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { HandleSuccess } from "./types";
import { stringify } from "qs-esm";
import * as m from "motion/react-m";
import { HandleError } from ".";

export type UserHandleComponentProps = {
  fieldToUse: string;
  operation: Operation;
  path: string;
  serverURL: string;
  startValue?: string | null;
  userId: string;
  editorId: string;
} & TextFieldClientProps;
export const HandleComponent: FC<UserHandleComponentProps> = ({
  fieldToUse = "username",
  path,
  userId,
  editorId,
  operation,
  startValue,
  readOnly: readOnlyFromProps,
  serverURL,
  field,
  permissions
}) => {
  const TTL = useMemo(() => 1000 * 60 * 15, []);

  const { value, setValue } = useField<string>({ path });
  const { value: unValue, setValue: setUserName } = useField<string>({
    path: fieldToUse
  });
  const { setValue: setLabelValue } = useField<string>({
    path: "displayUserName"
  });
  const validateUniqueness = useCallback(
    async (value: string | null) => {
      if (!value) {
        setIsError(true);
        setInternalError("Value is required");

        return new Error("Value is required");
      }

      try {
        setShouldValidate(false);
        if (res.ok) {
          suggestionRef.current = null;
          setShouldShowSuggestion(false);
          setValue((sugg as HandleSuccess).handle);
          lastValidValue.current = {
            value: (sugg as HandleSuccess).handle,
            time: performance.now()
          };
          return {
            message: "Handle is unique",
            handle: (sugg as HandleSuccess).handle
          };
        } else {
          const s = sugg as HandleError;
          if ("error" in s) {
            setIsError(true);
            setInternalError(s.error);
            return new Error(s.error);
          }

          if (lastValidValue.current) {
            if (performance.now() - lastValidValue.current.time < TTL) {
              suggestionRef.current = lastValidValue.current.value;
              setInputSize(
                suggestionRef.current.length || textValueRef.current.length
              );
              setShouldShowSuggestion(true);
            }
          }

          setIsError(true);
          setInternalError(`The handle ${value} already exists`);
          return new Error(`The handle ${value} already exists`);
        }
      } catch (e) {
        setIsError(true);
        return e;
      }
    },
    [operation, userId, editorId, serverURL, setValue, TTL]
  );
  const [textValue, setTextValue] = useState(value);
  const textValued = useMotionValue(textValue);
  useEffect(() => {
    textValued.set(textValue);
  }, [textValue, textValued]);
  const [inputSize, setInputSize] = useState(20);
  const lastValidValue = useRef({ value, time: DateTime.now().toMillis() });
  const [focused, setFocused] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const suggestionRef = useRef<string[]>([]);
  const suggestedValue = useMotionValue("");
  const [isError, setIsError] = useState<boolean>(false);
  const [shouldValidate, setShouldValidate] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null!);
  const [ghostText, setGhostText] = useState(value ?? "");
  const [ghostLength, setGhostLength] = useState(ghostText.length);
  useEffect(() => {
    setGhostLength(ghostText.length);
  }, [ghostText]);
  const sanitizeRef = useRef<ReturnType<typeof setTimeout>>(null);

  const shouldSanitizeRef = useRef(false);
  const lastToastID = useRef<string | number | null>(null);
  const validateRef = useRef<ReturnType<typeof setTimeout>>(null);
  const textValueRef = useRef(textValue);
  const realTimeSanitize = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    const sV = formatUserHandleLite(v);
    textValueRef.current = sV;
    setTextValue(sV);
  }, []);
  useEffect(() => {
    sanitizeRef.current && clearTimeout(sanitizeRef.current);
    sanitizeRef.current = setTimeout(() => {
      const isValid = HANDLE_TEST_REGEX.test(textValue);
      if (!isValid) {
        setIsError(true);
        setShouldValidate(false);
        toast.error("Invalid handle");
        return;
      } else {
        setIsError(false);
        if (lastValidValue.current.value !== textValue) {
          setShouldValidate(true);
        }
      }
    }, 550);
  }, [textValue]);

  const validateValue = useCallback(
    (e: ChangeEvent<HTMLInputElement> | FocusEvent<HTMLInputElement>) => {
      e.preventDefault();
      const tv = e.currentTarget.value;
      if (tv.length < 0) return;
      validateRef.current = setTimeout(() => {
        setInternalError(null);
        setIsError(false);
        const promise = ensureUniqueHandle({
          handle: tv,
          userId
        })
          .then(({ handle, message }) => {
            return { handle, message };
          })
          .catch((e) => {
            if (e instanceof HandleError) {
              throw e;
            }
            throw new HandleError("unknown_error");
          });
        lastToastID.current && toast.dismiss(lastToastID.current);
        lastToastID.current = null;
        toast.promise(promise, {
          loading: "Checking...",
          success: (data) => {
            setTextValue(data.handle);
            return {
              message: data.message,
              style: {
                backgroundColor: "var(--color-foreground)",
                color: "var(--color-bleu-900)"
              },
              duration: 4000
            };
          },
          error: (error: Error | HandleError) => {
            let message = "Something went wrong";
            if (error instanceof HandleError) {
              if (error.message.includes("exists")) {
                message = "The handle is taken :(";
                if (error.data?.alts) {
                  suggestionRef.current = [...error.data.alts];
                  suggestionRef.current.length > 0 &&
                    (message =
                      "The handle is taken :( Look at the few alternatives we\`ve got");
                }
              }
              setInternalError(message);
              setIsError(true);
              const sg =
                suggestionRef.current[0] || lastValidValue.current.value;
              setInputSize(sg.length);
              setGhostLength(sg.length);
              setGhostText(sg);
            }
            return {
              message,
              style: {
                backgroundColor: "var(--color-foreground)",
                color: "var(--color-rouge-900)"
              },
              duration: 4000
            };
          }
        });
      }, 100);
    },
    [userId]
  );
  useEffect(() => {
    validateRef.current &&
      (clearTimeout(validateRef.current), (validateRef.current = null));
    if (shouldValidate && !focused) {
    }
  }, [shouldValidate, validateUniqueness, focused, userId]);

  const sanitizerCallback = useCallback((v: string) => {
    const sanitized = formatUserHandle(v);
    shouldSanitizeRef.current = false;
    return sanitized;
  }, []);

  const [shouldShowSuggestion, setShouldShowSuggestion] = useState(false);
  const suggestMode = useCallback(() => {
    const ghoster = suggestedValue.get();
    const curvb = textValued.get();
    setGhostText(
      ghoster.length > curvb.length && ghoster.startsWith(curvb)
        ? ghoster.replace(/[^a-zA-Z0-9]/g, " ") + ghoster.slice(curvb.length)
        : ghoster
    );
    inputRef.current.addEventListener("keydown", onKeyDown);
  }, [onKeyDown, suggestedValue, textValued]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === " ") {
        e.preventDefault();
        if (suggestionRef.current) {
          setValue();
        }
        setShouldShowSuggestion(false);
        suggestionRef.current = null;

        setInternalError(null);
      } else if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        e.key.startsWith("Arrow")
      ) {
        return;
      } else {
        setShouldShowSuggestion(false);
        suggestionRef.current = null;
        setInternalError(null);
      }
    },
    [setValue]
  );

  useEffect(() => {
    setTextValue(value);
    setUserName(value);
    setLabelValue(`@${value}`);
  }, [setLabelValue, setUserName, value]);

  if (!editorId) {
    return <></>;
  }
  if (operation === "update") {
    if (!userId) {
      return <></>;
    }
  }
  return (
    <div className="field-type handle-field-component">
      <label
        htmlFor="slugInput"
        className="ease my-2 text-foreground transition-colors duration-200 data-[error=true]:text-rouge-700"
        data-error={isError}
        data-themed={"color"}
      >
        Username
      </label>
      <div className="relative flex flex-col gap-2">
        <div
          className="absolute inset-0 flex w-full flex-col justify-end data-[has-label=true]:mt-[24px]"
          data-has-label={true}
          data-error={isError}
          data-focus={focused}
        >
          <div className="flex h-full flex-col">
            <div className="tap-highlight-transparent transition-background is-filled relative box-border inline-flex h-10 min-h-10 w-full flex-row items-center !gap-0 !rounded-none border-b-[1px] border-transparent !px-1 !pb-0 shadow-[0_1px_0px_0_rgba(0,0,0,0.05)] !duration-150">
              <div className="box-border inline-flex h-full w-full items-center pb-1.5">
                <div className="pointer-events-none flex items-center">
                  <span className="opacity-0">@</span>
                </div>
                <m.input
                  data-filled="true"
                  readOnly={true}
                  disabled={true}
                  data-filled-within="true"
                  data-has-start-content="true"
                  size={ghostLength}
                  className="is-filled bg-transparent pb-0 pl-[4px] font-mono text-[14px] font-normal text-muted-foreground/40 opacity-0 !outline-hidden transition-all placeholder:text-transparent autofill:bg-transparent focus-visible:outline-hidden data-[has-end-content=true]:pe-1.5 data-[has-start-content=true]:ps-1.5 data-[show=true]:opacity-100 data-[show=true]:fade-in data-[type=color]:rounded-none"
                  aria-label=" "
                  type="text"
                  id="ghostInput"
                  value={ghostText}
                  data-show={shouldShowSuggestion}
                  title=""
                />
                {shouldShowSuggestion && (
                  <div className="font-faded-foreground/40 flex animate-in items-center justify-center gap-1 text-[10px] duration-150 ease-linear fade-in">
                    <kbd className="text-muted-fg/40 font-mono text-xs">
                      Tab
                    </kbd>
                    <span> to accept</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="group relative inset-0 flex w-full flex-col justify-end data-[has-label=true]:mt-[24px]"
          data-has-label={true}
          data-error={isError}
          data-focus={focused}
          data-filled={textValue.length > 0}
          data-has-value={textValue.length > 0}
        >
          <div className="flex h-full flex-col">
            <div
              className={cn(
                "tap-highlight-transparent border-default-200 after:bg-default-foreground rounded-medium transition-background after:ease relative box-border inline-flex h-10 min-h-10 w-full flex-row items-center !gap-0 gap-3 !rounded-none border-b-[1px] !px-1 px-3 !pb-0 shadow-[0_1px_0px_0_rgba(0,0,0,0.05)] !duration-150 after:absolute after:-bottom-[2px] after:left-1/2 after:h-px after:w-0 after:origin-center after:-translate-x-1/2 after:transition-colors after:duration-200 after:content-[''] group-data-[focus=true]:after:w-full motion-reduce:transition-none motion-reduce:after:transition-none",
                { "is-filled": textValue.length > 0 },
                { "after:bg-rouge-700": isError }
              )}
            >
              <div className="box-border inline-flex h-full w-full items-center pb-1.5">
                <div className="pointer-events-none flex items-center">
                  <span
                    className={cn(
                      "text-[14px] text-faded-foreground transition-colors duration-200 ease-in-out data-[error=true]:text-rouge-700 data-[focus=true]:text-faded-foreground/40"
                    )}
                    data-error={isError}
                    data-focus={focused}
                  >
                    @
                  </span>
                </div>
                <input
                  data-filled="true"
                  readOnly={readOnlyFromProps}
                  onBlur={validateValue}
                  onFocus={() => setFocused(true)}
                  data-error={isError}
                  data-filled-within="true"
                  data-has-start-content="true"
                  data-has-end-content="true"
                  maxLength={30}
                  ref={inputRef}
                  className="placeholder:text-foreground-500 ease w-full !border-none bg-transparent bg-clip-text pb-0 pl-[2px] font-mono text-[14px] font-normal transition-colors duration-200 !outline-none group-data-[has-value=true]:text-foreground autofill:bg-transparent data-[error=true]:text-rouge-700 data-[has-end-content=true]:pe-1.5 data-[has-start-content=true]:ps-1.5 data-[type=color]:rounded-none"
                  aria-label=" "
                  style={{
                    backgroundColor: "transparent",
                    border: "none",
                    outline: "none",
                    boxShadow: "none"
                  }}
                  type="text"
                  id="slugInput"
                  value={value}
                  onChange={realTimeSanitize}
                  title=""
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
