"use client";

import { Check, Loader2, Pencil, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode
} from "react";

import { cn } from "@/lib/utils";
import { FieldRow } from "./FieldRow";

/**
 * Tier 2 — Deferred-edit field.
 *
 * The signature interaction of admin surfaces. At rest, the row reads as
 * read-only — sans value, no input chrome. On hover, a hairline underline
 * appears under the value and the trailing pencil glyph rises from /30 to
 * /80, signalling editability. Click swaps the value out for an inline
 * input with explicit save / cancel controls; Esc cancels, Enter saves.
 *
 * Use for: firstName, lastName, bio, location (when not behind a map
 * picker), and similar identity / soft fields.
 */
type SaveResult = void | { ok: false; message?: string } | { ok: true };

interface EditableFieldProps {
  label: string;
  description?: string;
  /** Optional leading icon (16px). */
  icon?: ReactNode;
  /** Current persisted value. */
  value: string;
  /**
   * Persist a new value. Resolve to `{ ok: true }` (or void) on success;
   * resolve to `{ ok: false, message }` (or throw) on failure.
   */
  onSave: (next: string) => Promise<SaveResult> | SaveResult;
  /** Hint shown when value is empty. */
  emptyHint?: string;
  /** Max characters; surfaces a counter near the input on edit. */
  maxLength?: number;
  /** Multiline (textarea) instead of single-line input. */
  multiline?: boolean;
  /** Rows for the textarea; only when `multiline`. Defaults to 3. */
  rows?: number;
  /**
   * Sync validator. Return null/undefined when valid; return a string
   * error message to block save.
   */
  validate?: (next: string) => string | null | undefined;
  /** Layout — see FieldRow. */
  align?: "inline" | "stack";
  className?: string;
}

export function EditableField({
  label,
  description,
  icon,
  value,
  onSave,
  emptyHint,
  maxLength,
  multiline = false,
  rows = 3,
  validate,
  align = "inline",
  className
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const errorId = useId();

  // Keep draft in sync if the upstream value changes while we're idle.
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  // Focus on enter-edit.
  useEffect(() => {
    if (editing) {
      const el = inputRef.current;
      if (el) {
        el.focus();
        // Move caret to end without selecting.
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
    }
  }, [editing]);

  const enterEdit = useCallback(() => {
    setDraft(value);
    setError(null);
    setEditing(true);
  }, [value]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
    setError(null);
    setDraft(value);
  }, [value]);

  const commit = useCallback(async () => {
    const next = draft.trim();
    if (next === value) {
      setEditing(false);
      return;
    }
    if (validate) {
      const err = validate(next);
      if (err) {
        setError(err);
        return;
      }
    }
    setPending(true);
    setError(null);
    try {
      const result = await onSave(next);
      if (result && typeof result === "object" && "ok" in result && !result.ok) {
        setError(result.message ?? "Couldn't save");
        return;
      }
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setPending(false);
    }
  }, [draft, value, validate, onSave]);

  const onKeyDown = (
    e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    } else if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      void commit();
    } else if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void commit();
    }
  };

  const remaining = maxLength != null ? maxLength - draft.length : null;
  const showCounter =
    remaining != null &&
    maxLength != null &&
    (remaining <= 20 || remaining / maxLength <= 0.15);

  return (
    <FieldRow
      label={label}
      description={description}
      icon={icon}
      align={align}
      interactive={!editing}
      className={className}
    >
      {editing ? (
        <div className="flex w-full flex-col gap-2">
          <div className="flex w-full items-center gap-2">
            {multiline ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                rows={rows}
                maxLength={maxLength}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  "min-w-0 flex-1 resize-none border-b border-foreground/40 bg-transparent pb-1 text-sm text-foreground",
                  "focus:border-foreground focus:outline-none"
                )}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={maxLength}
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? errorId : undefined}
                className={cn(
                  "min-w-0 flex-1 border-b border-foreground/40 bg-transparent pb-1 text-sm text-foreground",
                  "focus:border-foreground focus:outline-none"
                )}
              />
            )}
            <button
              type="button"
              onClick={() => void commit()}
              disabled={pending}
              aria-label="Save"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/70 transition-colors hover:bg-foreground/[0.06] hover:text-foreground disabled:opacity-40"
            >
              {pending ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} strokeWidth={1.6} />
              )}
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={pending}
              aria-label="Cancel"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-foreground/55 transition-colors hover:bg-foreground/[0.06] hover:text-foreground/85 disabled:opacity-40"
            >
              <X size={14} strokeWidth={1.6} />
            </button>
          </div>
          <div className="flex min-h-[1rem] items-center gap-3 text-xs">
            {error ? (
              <span id={errorId} className="text-rouge-500/85" role="alert">
                {error}
              </span>
            ) : null}
            {showCounter ? (
              <span
                className={cn(
                  "ml-auto tabular-nums",
                  remaining! < 0
                    ? "text-rouge-500/85"
                    : "text-foreground/55 dark:text-foreground/50"
                )}
              >
                {remaining}
              </span>
            ) : null}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={enterEdit}
          className={cn(
            "group/edit flex items-center gap-2.5 rounded text-left transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
          aria-label={`Edit ${label}`}
        >
          <span
            className={cn(
              "border-b border-transparent pb-px text-sm text-foreground/85 transition-colors",
              "group-hover/edit:border-foreground/30 group-hover/edit:text-foreground"
            )}
          >
            {value || (
              <span className="text-foreground/45 dark:text-foreground/40">
                {emptyHint ?? "—"}
              </span>
            )}
          </span>
          <Pencil
            size={12}
            strokeWidth={1.5}
            className="shrink-0 text-foreground/30 transition-colors group-hover/edit:text-foreground/80 dark:text-foreground/25"
          />
        </button>
      )}
    </FieldRow>
  );
}
