"use client";

import type { RichTextFieldClient } from "payload";

import {
  type FeatureProviderClient,
  type SanitizedClientEditorConfig
} from "@payloadcms/richtext-lexical";
import { ShimmerEffect, useConfig } from "@payloadcms/ui";
import { lazy, Suspense, useEffect, useMemo, useState, type FC } from "react";

import {
  BoldFeatureClient,
  defaultEditorLexicalConfig,
  InlineToolbarFeatureClient,
  ItalicFeatureClient,
  sanitizeClientEditorConfig
} from "@payloadcms/richtext-lexical/client";
import type { LexicalRichTextFieldProps } from "node_modules/@payloadcms/richtext-lexical/dist/types";
import { loadClientFeatures } from "./loader";

const RichTextEditor = lazy(() =>
  import("./inline").then((module) => ({ default: module.RichText }))
);

export const RichTextField: FC<LexicalRichTextFieldProps> = (props) => {
  const {
    admin = {},
    clientFeatures: vc,
    featureClientImportMap,
    path,
    field,
    lexicalEditorConfig = defaultEditorLexicalConfig,
    schemaPath
  } = props;
  const featureClientSchemaMap = useMemo(() => ({}), []);
  const { config } = useConfig();
  const clientFeatures = useMemo(
    () => ({
      toolbarInline: {
        clientFeatureProps: {
          featureKey: "toolbarInline",
          order: 0
        },
        clientFeatureProvider: InlineToolbarFeatureClient
      },

      bold: {
        clientFeatureProps: {
          featureKey: "bold",
          order: 1
        },
        clientFeatureProvider: BoldFeatureClient
      },
      italic: {
        clientFeatureProps: {
          featureKey: "italic",
          order: 2
        },
        clientFeatureProvider: ItalicFeatureClient
      }
    }),
    []
  );
  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<null | SanitizedClientEditorConfig>(null);

  useEffect(() => {
    if (finalSanitizedEditorConfig) {
      return;
    }
    if (!clientFeatures) {
      console.error("clientFeatures is undefined");
      return;
    }
    const featureProvidersLocal: FeatureProviderClient<any, any>[] = [];

    for (const [_featureKey, clientFeature] of Object.entries(clientFeatures)) {
      if (!clientFeature.clientFeatureProvider) {
        continue;
      }
      featureProvidersLocal.push(
        clientFeature.clientFeatureProvider(clientFeature.clientFeatureProps)
      ); // Execute the clientFeatureProvider function here, as the server cannot execute functions imported from use client files
    }
    const finalLexicalEditorConfig = lexicalEditorConfig
      ? lexicalEditorConfig
      : defaultEditorLexicalConfig;

    const resolvedClientFeatures = loadClientFeatures({
      config,
      featureClientImportMap,
      featureClientSchemaMap,
      field: field as RichTextFieldClient,
      schemaPath: schemaPath ?? field.name,
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: finalLexicalEditorConfig
      }
    });

    setFinalSanitizedEditorConfig(
      sanitizeClientEditorConfig(
        resolvedClientFeatures,
        finalLexicalEditorConfig,
        admin
      )
    );
  }, [
    lexicalEditorConfig,
    admin,
    finalSanitizedEditorConfig,
    clientFeatures,
    featureClientImportMap,
    featureClientSchemaMap,
    field,
    config,
    schemaPath
  ]); // TODO: Optimize this and use useMemo for this in the future. This might break sub-richtext-blocks from the blocks feature. Need to investigate

  return (
    <Suspense fallback={<ShimmerEffect height="40px" />}>
      {finalSanitizedEditorConfig && (
        <RichTextEditor
          {...props}
          clientFeatures={clientFeatures}
          schemaPath={schemaPath}
          featureClientSchemaMap={featureClientSchemaMap}
          initialLexicalFormState={{}}
          editorConfig={finalSanitizedEditorConfig}
        />
      )}
    </Suspense>
  );
};
