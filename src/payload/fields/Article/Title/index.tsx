"use client";

import type { RichTextFieldClient } from "payload";

import {
  type FeatureProviderClient,
  type FeatureProviderProviderClient,
  type SanitizedClientEditorConfig
} from "@payloadcms/richtext-lexical";
import { ShimmerEffect, useConfig } from "@payloadcms/ui";
import { lazy, Suspense, useEffect, useMemo, useState, type FC } from "react";

import { loadClientFeatures } from "@/payload/Lexical/defaults/loadClientFeatures";
import {
  defaultEditorLexicalConfig,
  sanitizeClientEditorConfig
} from "@payloadcms/richtext-lexical/client";
import type { LexicalRichTextFieldProps } from "node_modules/@payloadcms/richtext-lexical/dist/types";
const RichTextEditor = lazy(() =>
  import("./inline").then((module) => ({ default: module.RichText }))
);

export const RichTextField: FC<LexicalRichTextFieldProps> = (props) => {
  const {
    admin = {},
    clientFeatures: cv,
    featureClientImportMap = {},
    permissions,

    path,
    field,
    lexicalEditorConfig = defaultEditorLexicalConfig,
    schemaPath
  } = props;
  const featureClientSchemaMap = useMemo(() => ({}), []);
  const { config } = useConfig();
  // ({
  //     toolbarInline: {
  //       clientFeatureProps: {
  //         featureKey: "toolbarInline",
  //         order: 0
  //       },
  //       clientFeatureProvider: InlineToolbarFeatureClient
  //     },

  //     bold: {
  //       clientFeatureProps: {
  //         featureKey: "bold",
  //         order: 1
  //       },
  //       clientFeatureProvider: BoldFeatureClient
  //     },
  //     italic: {
  //       clientFeatureProps: {
  //         featureKey: "italic",
  //         order: 2
  //       },
  //       clientFeatureProvider: ItalicFeatureClient
  //     }
  //   }),
  const clientFeatures = useMemo(
    () =>
      ({}) as Record<
        string,
        {
          clientFeatureProps: {
            featureKey: string;
            order: number;
          };
          clientFeatureProvider: FeatureProviderProviderClient;
        }
      >,
    []
  );
  const [finalSanitizedEditorConfig, setFinalSanitizedEditorConfig] =
    useState<null | SanitizedClientEditorConfig>(null);

  useEffect(() => {
    if (finalSanitizedEditorConfig) {
      return;
    }

    const featureProvidersLocal: FeatureProviderClient<any, any>[] = [];
    for (const clientFeature of Object.values(clientFeatures)) {
      if (!clientFeature.clientFeatureProvider) {
        continue;
      }
      featureProvidersLocal.push(
        clientFeature.clientFeatureProvider(clientFeature.clientFeatureProps)
      ); // Execute the clientFeatureProvider function here, as the server cannot execute functions imported from use client files
    }

    const resolvedClientFeatures = loadClientFeatures({
      config,
      featureClientImportMap,
      featureClientSchemaMap,
      field: field as RichTextFieldClient,
      schemaPath: schemaPath ?? field.name,
      unSanitizedEditorConfig: {
        features: featureProvidersLocal,
        lexical: lexicalEditorConfig
      }
    });

    setFinalSanitizedEditorConfig(
      sanitizeClientEditorConfig(
        resolvedClientFeatures,
        lexicalEditorConfig,
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
          permissions={permissions}
          field={field}
          lexicalEditorConfig={undefined}
          path={path}
          clientFeatures={clientFeatures}
          schemaPath={schemaPath}
          featureClientImportMap={{}}
          featureClientSchemaMap={featureClientSchemaMap}
          initialLexicalFormState={{}}
          editorConfig={finalSanitizedEditorConfig}
        />
      )}
    </Suspense>
  );
};
