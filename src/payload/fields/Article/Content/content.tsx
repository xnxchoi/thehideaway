"use client";

import { cn } from "@/lib/utils";
import { dequal } from "dequal";
import {
  type ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { ErrorBoundary } from "react-error-boundary";

import type { SanitizedClientEditorConfig } from "@payloadcms/richtext-lexical";
import type { RichTextField } from "@payloadcms/richtext-lexical/client";
import type {
  EditorState,
  SerializedEditorState
} from "@payloadcms/richtext-lexical/lexical";
import {
  BulkUploadProvider,
  useEditDepth,
  useEffectEvent,
  useField
} from "@payloadcms/ui";
import { mergeFieldStyles } from "@payloadcms/ui/shared";
import type { LexicalRichTextFieldProps } from "node_modules/@payloadcms/richtext-lexical/dist/types";
import type { Validate } from "payload";
import { LexicalProvider } from "./LexicalProvider";
import { useRunDeprioritized } from "@/payload/Lexical/defaults/useRunDeprioritized";

export type RichTextFieldProps = ComponentProps<typeof RichTextField>;

const baseClass = "rich-text-lexical";
const ContentRichtext = (
  props: {
    readonly editorConfig: SanitizedClientEditorConfig; // With rendered features n stuff
  } & LexicalRichTextFieldProps
) => {
  const {
    editorConfig,
    field,
    field: {
      admin: { className, description, readOnly: readOnlyFromAdmin } = {},
      label,
      localized,
      required
    },
    path: pathFromProps,
    readOnly: readOnlyFromTopLevelProps,
    validate // Users can pass in client side validation if they WANT to, but it's not required anymore
  } = props;

  const readOnlyFromProps = readOnlyFromTopLevelProps || readOnlyFromAdmin;

  const editDepth = useEditDepth();

  const memoizedValidate = useCallback<Validate>(
    (value, validationOptions) => {
      if (typeof validate === "function") {
        // @ts-expect-error - vestiges of when tsconfig was not strict. Feel free to improve
        return validate(value, { ...validationOptions, required });
      }
      return true;
    },
    // Important: do not add props to the dependencies array.
    // This would cause an infinite loop and endless re-rendering.
    // Removing props from the dependencies array fixed this issue: https://github.com/payloadcms/payload/issues/3709
    [validate, required]
  );

  const {
    customComponents: {
      AfterInput,
      BeforeInput,
      Description,
      Error,
      Label
    } = {},
    disabled: disabledFromField,
    initialValue,
    path,
    setValue,
    showError,
    value
  } = useField<SerializedEditorState>({
    potentiallyStalePath: pathFromProps,
    validate: memoizedValidate
  });

  const disabled = readOnlyFromProps || disabledFromField;

  const [isSmallWidthViewport, setIsSmallWidthViewport] =
    useState<boolean>(false);
  const [rerenderProviderKey, setRerenderProviderKey] = useState<Date>();

  const prevInitialValueRef = useRef<SerializedEditorState | undefined>(
    initialValue
  );
  const prevValueRef = useRef<SerializedEditorState | undefined>(value);
  useEffect(() => {
    const updateViewPortWidth = () => {
      const isNextSmallWidthViewport =
        window.matchMedia("(max-width: 768px)").matches;

      if (isNextSmallWidthViewport !== isSmallWidthViewport) {
        setIsSmallWidthViewport(isNextSmallWidthViewport);
      }
    };
    updateViewPortWidth();
    window.addEventListener("resize", updateViewPortWidth);

    return () => {
      window.removeEventListener("resize", updateViewPortWidth);
    };
  }, [isSmallWidthViewport]);

  const pathWithEditDepth = `${path}.${editDepth}`;

  const runDeprioritized = useRunDeprioritized(); // defaults to 500 ms timeout

  const handleChange = useCallback(
    (editorState: EditorState) => {
      // Capture `editorState` in the closure so we can safely run later.
      const updateFieldValue = () => {
        const newState = editorState.toJSON();
        prevValueRef.current = newState;
        setValue(newState);
      };

      // Queue the update for the browser’s idle time (or Safari shim)
      // and let the hook handle debouncing/cancellation.
      void runDeprioritized(updateFieldValue);
    },
    [setValue, runDeprioritized] // `runDeprioritized` is stable (useCallback inside hook)
  );

  const styles = useMemo(() => mergeFieldStyles(field), [field]);

  const handleInitialValueChange = useEffectEvent(
    (initialValue: SerializedEditorState | undefined) => {
      // Object deep equality check here, as re-mounting the editor if
      // the new value is the same as the old one is not necessary.
      // In postgres, the order of keys in JSON objects is not guaranteed to be preserved,
      // so we need to do a deep equality check here that does not care about key order => we use dequal.
      // If we used JSON.stringify, the editor would re-mount every time you save the document, as the order of keys changes => change detected => re-mount.
      if (
        prevValueRef.current !== value &&
        !dequal(
          prevValueRef.current != null
            ? JSON.parse(JSON.stringify(prevValueRef.current))
            : prevValueRef.current,
          value
        )
      ) {
        prevInitialValueRef.current = initialValue;
        prevValueRef.current = value;
        setRerenderProviderKey(new Date());
      }
    }
  );

  useEffect(() => {
    // Needs to trigger for object reference changes - otherwise,
    // reacting to the same initial value change twice will cause
    // the second change to be ignored, even though the value has changed.
    // That's because initialValue is not kept up-to-date
    if (!Object.is(initialValue, prevInitialValueRef.current)) {
      handleInitialValueChange(initialValue);
    }
  }, [initialValue]);

  return (
    <div
      className={cn(
        baseClass,
        "field-type",

        showError && "error",
        disabled && `${baseClass}--read-only`,
        "content-rich-text"
      )}
      key={pathWithEditDepth}
      style={styles}
    >
      <div className={`${baseClass}__wrap`}>
        <ErrorBoundary fallbackRender={fallbackRender} onReset={() => {}}>
          {/* Lexical may be in a drawer. We need to define another BulkUploadProvider to ensure that the bulk upload drawer
          is rendered in the correct depth (not displayed *behind* the current drawer)*/}
          <BulkUploadProvider drawerSlugPrefix={path}>
            {" "}
            <LexicalProvider
              composerKey={pathWithEditDepth}
              editorConfig={editorConfig}
              fieldProps={props}
              isSmallWidthViewport={isSmallWidthViewport}
              key={JSON.stringify({ path, rerenderProviderKey })} // makes sure lexical is completely re-rendered when initialValue changes, bypassing the lexical-internal value memoization. That way, external changes to the form will update the editor. More infos in PR description (https://github.com/payloadcms/payload/pull/5010)
              onChange={handleChange}
              readOnly={disabled}
              value={value}
            />
          </BulkUploadProvider>
        </ErrorBoundary>
      </div>
    </div>
  );
};

function fallbackRender({ error }: { error: Error }) {
  // Call resetErrorBoundary() to reset the error boundary and retry the render.

  return (
    <div className="errorBoundary" role="alert">
      <p>Something went wrong:</p>
      <pre style={{ color: "red" }}>{error.message}</pre>
    </div>
  );
}
export const RichText: typeof ContentRichtext = ContentRichtext;
