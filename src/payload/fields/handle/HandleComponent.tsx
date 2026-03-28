"use client";
import "./index.scss";
import { ensureUniqueHandle } from "@/payload/fields/handle/ensureUniqueHandle";
import { Operation, TextFieldClientProps } from "payload";
import type { ChangeEvent, FC, KeyboardEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useField } from "@payloadcms/ui";
import {
  formatUserHandleLite,
  HANDLE_TEST_REGEX
} from "@/payload/fields/handle/formatUserHandle";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
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

/** Milliseconds of typing silence before auto-validation fires */
const VALIDATE_DEBOUNCE_MS = 600;

export const HandleComponent: FC<UserHandleComponentProps> = ({
  fieldToUse = "username",
  path,
  userId,
  editorId,
  operation,
  readOnly: readOnlyFromProps,
  field,
  permissions
}) => {
  // ── PayloadCMS field bindings ────────────────────────────────────────────
  const { value, setValue } = useField<string>({ path });
  const { setValue: setUsernameValue } = useField<string>({ path: fieldToUse });
  const { setValue: setDisplayLabel } = useField<string>({ path: "displayUserName" });

  // ── Local UI state ───────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState<string>(value ?? "");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Last value that was successfully validated & committed to field state */
  const lastSavedRef = useRef<string | null>(value ?? null);

  // ── Ghost text (IDE-style inline completion) ─────────────────────────────
  // Pick the first alternative that is a prefix-continuation of what's typed.
  const inlineSuggestion =
    suggestions.find((s) => s.startsWith(inputValue) && s.length > inputValue.length) ?? null;
  const ghostSuffix = inlineSuggestion ? inlineSuggestion.slice(inputValue.length) : "";

  // ── Commit a validated value to all synced fields ────────────────────────
  const commitValue = useCallback(
    (handle: string) => {
      setValue(handle);
      setUsernameValue(handle);
      setDisplayLabel(`@${handle}`);
      lastSavedRef.current = handle;
    },
    [setValue, setUsernameValue, setDisplayLabel]
  );

  // ── Core validation (calls server action) ────────────────────────────────
  const validate = useCallback(
    async (handle: string) => {
      if (!handle) {
        setIsError(true);
        setErrorMessage("Username is required");
        return;
      }

      if (!HANDLE_TEST_REGEX.test(handle)) {
        setIsError(true);
        setErrorMessage("Use letters, numbers, underscores, or periods (max 30)");
        return;
      }

      // Skip network round-trip when value hasn't changed from last save
      if (handle === lastSavedRef.current) {
        setIsError(false);
        setErrorMessage(null);
        return;
      }

      setIsValidating(true);
      setIsError(false);
      setErrorMessage(null);

      try {
        const result = await ensureUniqueHandle({ handle, userId });
        commitValue(result.handle);
        setSuggestions([]);
        setShowSuggestions(false);
        toast.success(`@${result.handle} is yours!`, {
          style: {
            backgroundColor: "var(--color-foreground)",
            color: "var(--color-bleu-900)"
          },
          duration: 3000
        });
      } catch (err) {
        setIsError(true);

        if (err instanceof HandleError) {
          if (err.message === "Unauthorized") {
            setErrorMessage("You don't have permission to change this username");
            toast.error("Unauthorized", { duration: 3000 });
            return;
          }

          const alts = err.data?.alts ?? [];
          setSuggestions(alts);
          setShowSuggestions(alts.length > 0);

          if (alts.length > 0) {
            setErrorMessage(`@${handle} is taken — pick an alternative:`);
            toast.error(
              `@${handle} is taken — ${alts.length} alternative${alts.length !== 1 ? "s" : ""} available`,
              {
                style: {
                  backgroundColor: "var(--color-foreground)",
                  color: "var(--color-rouge-900)"
                },
                duration: 4000
              }
            );
          } else {
            setErrorMessage(`@${handle} is already taken`);
            toast.error(`@${handle} is already taken`, {
              style: {
                backgroundColor: "var(--color-foreground)",
                color: "var(--color-rouge-900)"
              },
              duration: 4000
            });
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
          setErrorMessage("Something went wrong — please try again");
          toast.error("Something went wrong", { duration: 3000 });
        }
      } finally {
        setIsValidating(false);
      }
    },
    [userId, commitValue]
  );

  // ── Schedule debounced validation ────────────────────────────────────────
  const scheduleValidation = useCallback(
    (handle: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => validate(handle), VALIDATE_DEBOUNCE_MS);
    },
    [validate]
  );

  // ── Event handlers ───────────────────────────────────────────────────────
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const sanitized = formatUserHandleLite(e.target.value);
      setInputValue(sanitized);
      // Clear stale suggestions/errors while the user is re-typing
      setSuggestions([]);
      setShowSuggestions(false);
      setIsError(false);
      setErrorMessage(null);
      scheduleValidation(sanitized);
    },
    [scheduleValidation]
  );

  const handleBlur = useCallback(() => {
    setFocused(false);
    // Cancel debounce and validate immediately on blur
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (inputValue && inputValue !== lastSavedRef.current) {
      validate(inputValue);
    }
  }, [inputValue, validate]);

  const acceptSuggestion = useCallback(
    (handle: string) => {
      setInputValue(handle);
      setSuggestions([]);
      setShowSuggestions(false);
      setIsError(false);
      setErrorMessage(null);
      commitValue(handle);
      toast.success(`Switched to @${handle}`, {
        style: {
          backgroundColor: "var(--color-foreground)",
          color: "var(--color-bleu-900)"
        },
        duration: 3000
      });
    },
    [commitValue]
  );

  /**
   * Tab / Space → accept inline ghost suggestion (IDE-style tab completion).
   * Escape → dismiss suggestions popover.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if ((e.key === "Tab" || e.key === " ") && inlineSuggestion) {
        e.preventDefault();
        acceptSuggestion(inlineSuggestion);
        return;
      }
      if (e.key === "Escape") {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [inlineSuggestion, acceptSuggestion]
  );

  // ── Sync from field value (e.g. form reset or external change) ───────────
  useEffect(() => {
    if (!focused && value !== undefined && value !== null && value !== inputValue) {
      setInputValue(value);
      lastSavedRef.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  // Keep username + displayUserName in sync whenever the saved field value changes
  useEffect(() => {
    if (value) {
      setUsernameValue(value);
      setDisplayLabel(`@${value}`);
    }
  }, [value, setUsernameValue, setDisplayLabel]);

  // Cleanup debounce timer on unmount
  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    []
  );

  // ── Guards ───────────────────────────────────────────────────────────────
  if (!editorId) return null;
  if (operation === "update" && !userId) return null;

  const readOnly = readOnlyFromProps ?? false;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="field-type handle-field-component">
      {/* Label row */}
      <label
        htmlFor="handle-input"
        className={cn(
          "my-2 block text-sm transition-colors duration-200 ease",
          isError ? "text-rouge-700" : "text-foreground"
        )}
      >
        Username
        {isValidating && (
          <span className="ml-2 inline-block animate-pulse text-xs text-muted-foreground">
            checking…
          </span>
        )}
      </label>

      <div className="relative flex flex-col gap-1.5">
        {/* ── Input row ────────────────────────────────────────────────── */}
        <div
          className={cn(
            "group relative flex h-10 w-full items-center border-b border-transparent",
            // Animated underline via ::after
            "after:absolute after:-bottom-px after:left-1/2 after:block after:h-px after:w-0",
            "after:origin-center after:-translate-x-1/2 after:transition-[width] after:duration-200 after:content-['']",
            focused && "after:w-full",
            isError ? "after:bg-rouge-700" : "after:bg-foreground"
          )}
        >
          {/* @ prefix */}
          <span
            className={cn(
              "pointer-events-none select-none font-mono text-sm leading-none transition-colors duration-200",
              isError
                ? "text-rouge-700"
                : focused
                  ? "text-faded-foreground/50"
                  : "text-faded-foreground"
            )}
          >
            @
          </span>

          {/* Text + ghost layer */}
          <div className="relative flex flex-1 items-center overflow-hidden">
            {/*
             * Ghost layer — always present, positioned behind the input.
             * Shows `inputValue` (invisible, just takes space) then `ghostSuffix`
             * (faded), so only the completion part is visible to the user.
             */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex select-none items-center pl-[3px] font-mono text-sm leading-none"
            >
              {/* Invisible spacer matching the typed text */}
              <span className="invisible whitespace-pre">{inputValue}</span>
              {/* Faded suffix — the IDE-style ghost completion */}
              {ghostSuffix && (
                <span className="whitespace-pre text-muted-foreground/30">{ghostSuffix}</span>
              )}
            </span>

            {/*
             * Real input — text is transparent so the span layer shows through,
             * but the browser caret remains visible.
             */}
            <input
              ref={inputRef}
              id="handle-input"
              type="text"
              value={inputValue}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={() => setFocused(true)}
              onKeyDown={handleKeyDown}
              readOnly={readOnly}
              disabled={readOnly}
              maxLength={30}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={isError}
              aria-describedby={
                isError && errorMessage ? "handle-error" : undefined
              }
              className={cn(
                "relative w-full bg-transparent font-mono text-sm leading-none",
                "border-none pl-[3px] pb-0 shadow-none outline-none",
                // Text is always transparent so the span layer is the visual text
                "[color:transparent]",
                readOnly && "cursor-not-allowed opacity-60"
              )}
              style={{
                caretColor: isError
                  ? "var(--color-rouge-700, #b91c1c)"
                  : "var(--color-foreground, currentColor)"
              }}
            />
          </div>

          {/* "Tab to accept" keyboard hint */}
          {ghostSuffix && focused && (
            <div className="pointer-events-none ml-1.5 flex shrink-0 items-center gap-1 text-[10px] text-muted-foreground/50">
              <kbd className="rounded border border-current px-1 py-px font-mono text-[9px] leading-none">
                Tab
              </kbd>
              <span>to accept</span>
            </div>
          )}
        </div>

        {/* ── Inline error message ──────────────────────────────────────── */}
        {isError && errorMessage && (
          <p
            id="handle-error"
            role="alert"
            className="animate-in fade-in slide-in-from-top-0.5 text-xs text-rouge-700 duration-150"
          >
            {errorMessage}
          </p>
        )}

        {/* ── Suggestions popover (alternatives when handle is taken) ───── */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            role="listbox"
            aria-label="Available username alternatives"
            className={cn(
              "animate-in fade-in slide-in-from-top-1 duration-150",
              "flex flex-col gap-1.5 rounded-sm border border-foreground/10 bg-background p-2.5 shadow-sm"
            )}
          >
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60">
              Alternatives
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  role="option"
                  aria-selected={suggestion === inlineSuggestion}
                  onClick={() => acceptSuggestion(suggestion)}
                  className={cn(
                    "rounded-sm border px-2 py-0.5 font-mono text-xs transition-colors duration-100",
                    "border-foreground/20 bg-foreground/5 text-foreground/70",
                    "hover:border-foreground/40 hover:bg-foreground/10 hover:text-foreground",
                    // Highlight the one that also has inline ghost text
                    suggestion === inlineSuggestion &&
                      "border-foreground/40 bg-foreground/10 text-foreground"
                  )}
                >
                  @{suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
