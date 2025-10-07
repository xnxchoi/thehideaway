"use client";

import type { User } from "@/payload-types";
import type {
  DefaultTypedEditorState,
  SerializedHeadingNode,
  SerializedParagraphNode,
  SerializedTextNode
} from "@payloadcms/richtext-lexical";
import {
  buildEditorState,
  InlineCodeFeatureClient,
  InlineToolbarFeatureClient,
  ItalicFeatureClient,
  RenderLexical,
  RichTextField,
  StrikethroughFeatureClient,
  SubscriptFeatureClient,
  SuperscriptFeatureClient
} from "@payloadcms/richtext-lexical/client";
import { useAuth, useField } from "@payloadcms/ui";
import { DateTime } from "luxon";
import type {
  RichTextFieldClientComponent,
  RichTextFieldClientProps,
  TextFieldClientComponent
} from "payload";
import { useEffect, useRef, useState, type ComponentProps } from "react";
import "./styles.scss";
import type { ParagraphNode, SerializedEditorState, TextNode } from "lexical";
import type { HeadingNode } from "@lexical/rich-text";
import { convertLexicalToPlaintext } from "@payloadcms/richtext-lexical/plaintext";
type RichTextValue = {
  root: {
    type: string;
    children: {
      type: string;
      version: number;
      [k: string]: unknown;
    }[];
    direction: ("ltr" | "rtl") | null;
    format: "left" | "start" | "center" | "right" | "end" | "justify" | "";
    indent: number;
    version: number;
  };
  [k: string]: unknown;
};
type RichTextFieldProps = ComponentProps<typeof RichTextField>;

const InlineRichText = (args: {
  field: RichTextFieldProps["field"];
  path: RichTextFieldProps["path"];
  schemaPath: string;
}) => {
  const { field, path, schemaPath } = args;
  const se = useAuth();
  const date = DateTime.now().toLocaleString(DateTime.DATETIME_MED);
  const user = se?.user;
  const author =
    (user &&
      user.collection === "users" &&
      (user as User & { collection: "users" }).name) ||
    false;
  const clientFeatures = {
    toolbarInline: {
      clientFeatureProps: {
        featureKey: "toolbarInline",
        order: 0
      },
      clientFeatureProvider: InlineToolbarFeatureClient
    },

    strikethrough: {
      clientFeatureProps: {
        featureKey: "strikethrough",
        order: 1
      },
      clientFeatureProvider: StrikethroughFeatureClient
    },
    italic: {
      clientFeatureProps: {
        featureKey: "italic",
        order: 2
      },
      clientFeatureProvider: ItalicFeatureClient
    },
    superScript: {
      clientFeatureProps: {
        featureKey: "superScript",
        order: 3
      },
      clientFeatureProvider: SuperscriptFeatureClient
    },
    subScript: {
      clientFeatureProps: {
        featureKey: "subScript",
        order: 4
      },
      clientFeatureProvider: SubscriptFeatureClient
    }
  };
  const { value: plainValue, setValue: setPlainValue } = useField<string>({
    path: "title"
  });
  const { value, setValue } = useField<RichTextValue>({ path });
  const [richValue, setRichValue] = useState<RichTextValue>(value);
  const lastTime = useRef(performance.now());
  const isRun = useRef(false);
  useEffect(() => {
    const children = value?.root?.children;
    if (!isRun.current) {
      if (children && children.length > 1) {
        setRichValue({
          root: {
            ...(value.root ?? {}),
            children: [children[0]]
          }
        });
      } else {
        setRichValue(value);
      }
    }
  }, [setValue, value]);
  const to = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!to.current) {
      to.current = setTimeout(() => {
        isRun.current = true;
        setValue(richValue);
        to.current = null;
      }, 50);
    }
    return () => {
      if (to.current) {
        clearTimeout(to.current);
      }
    };
  }, [richValue, setValue]);
  return author ? (
    <div className="inline-rich-text">
      <RichTextField
        path={path}
        schemaPath={schemaPath}
        initialLexicalFormState={{}}
        field={field}
        admin={{ hideGutter: true }}
        permissions={true}
        clientFeatures={clientFeatures}
        lexicalEditorConfig={undefined}
        featureClientImportMap={{
          toolbarInline: InlineToolbarFeatureClient,
          strikethrough: StrikethroughFeatureClient,
          italic: ItalicFeatureClient,
          superScript: SuperscriptFeatureClient,
          subScript: SubscriptFeatureClient
        }}
        featureClientSchemaMap={{}}
      />
    </div>
  ) : (
    <></>
  );
};

export default InlineRichText;
