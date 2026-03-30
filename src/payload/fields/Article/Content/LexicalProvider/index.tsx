import { RP_ImageNode } from "@/payload/fields/Article/Cover/rp-image/client/node/RP_ImageNode";
import type { LexicalProviderProps } from "@/payload/Lexical/defaults/types";
import {
  EditorConfigProvider,
  getEnabledNodes,
  useEditorConfigContext
} from "@payloadcms/richtext-lexical/client";
import {
  InitialConfigType,
  LexicalComposer
} from "@payloadcms/richtext-lexical/lexical/react/LexicalComposer";
import { useEditDepth } from "@payloadcms/ui";
import type { FC, ReactNode } from "react";
import { useMemo, useRef } from "react";
import { LexicalEditor as LexicalEditorComponent } from "./LexicalEditor";
import "./LexicalEditor.scss";

const NestProviders = ({
  children,
  providers
}: {
  children: ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  providers: any[];
}) => {
  if (!providers?.length) {
    return children;
  }
  const Component = providers[0];
  if (providers.length > 1) {
    return (
      <Component>
        <NestProviders providers={providers.slice(1)}>{children}</NestProviders>
      </Component>
    );
  }
  return <Component>{children}</Component>;
};

export const LexicalProvider: FC<LexicalProviderProps> = (props) => {
  const {
    composerKey,
    editorConfig,
    fieldProps,
    isSmallWidthViewport,
    onChange,
    readOnly,
    value
  } = props;

  const parentContext = useEditorConfigContext();

  const editDepth = useEditDepth();

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // useMemo for the initialConfig that depends on readOnly and value
  const initialConfig = useMemo<InitialConfigType>(() => {
    if (value && typeof value !== "object") {
      throw new Error(
        "The value passed to the Lexical editor is not an object. This is not supported. Please remove the data from the field and start again. This is the value that was passed in: " +
          JSON.stringify(value)
      );
    }

    if (value && Array.isArray(value) && !("root" in value)) {
      throw new Error(
        "You have tried to pass in data from the old Slate editor to the new Lexical editor. The data structure is different, thus you will have to migrate your data. We offer a one-line migration script which migrates all your rich text fields: https://payloadcms.com/docs/lexical/migration#migration-via-migration-script-recommended"
      );
    }

    if (value && "jsonContent" in value) {
      throw new Error(
        "You have tried to pass in data from payload-plugin-lexical. The data structure is different, thus you will have to migrate your data. Migration guide: https://payloadcms.com/docs/lexical/migration#migrating-from-payload-plugin-lexical"
      );
    }

    return {
      editable: readOnly !== true,
      editorState: value != null ? JSON.stringify(value) : undefined,
      // editorState: JSON.stringify(createEditorState("")),
      namespace: editorConfig.lexical.namespace,
      nodes: getEnabledNodes({ editorConfig }),
      onError: (error: Error) => {
        throw error;
      },
      theme: editorConfig.lexical.theme
    };
    // Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
    // cause the editor to lose focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorConfig]);

  if (!initialConfig) {
    return <p>Loading...</p>;
  }

  // We need to add initialConfig.editable to the key to force a re-render when the readOnly prop changes.
  // Without it, there were cases where lexical editors inside drawers turn readOnly initially - a few miliseconds later they turn editable, but the editor does not re-render and stays readOnly.
  return (
    <LexicalComposer
      initialConfig={{
        ...initialConfig,
        nodes: [...(initialConfig?.nodes || []), RP_ImageNode]
      }}
      key={composerKey + initialConfig.editable}
    >
      <EditorConfigProvider
        editorConfig={editorConfig}
        editorContainerRef={editorContainerRef}
        fieldProps={fieldProps}
        /**
         * Parent editor is not truly the parent editor, if the current editor is part of a drawer and the parent editor is the main editor.
         */
        parentContext={
          parentContext?.editDepth === editDepth ? parentContext : undefined
        }
      >
        <NestProviders providers={editorConfig.features.providers}>
          <LexicalEditorComponent
            editorConfig={editorConfig}
            editorContainerRef={editorContainerRef}
            isSmallWidthViewport={isSmallWidthViewport}
            onChange={onChange}
          />
        </NestProviders>
      </EditorConfigProvider>
    </LexicalComposer>
  );
};
