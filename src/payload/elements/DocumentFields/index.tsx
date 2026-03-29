"use client";
import { Gutter } from "@payloadcms/ui";
import { TrashBanner } from "@payloadcms/ui/elements/TrashBanner";
import type { ClientField, SanitizedDocumentPermissions } from "payload";
import { RenderFields } from "@/payload/forms/RenderFields";

import { HandoffBridge } from "@/payload/Lexical/Features/HandOff/handoffBridge";
import {
  AlternateDocProvider,
  useVaultSidebar,
  WriterProvider
} from "@/payload/providers/Admins";
import { fieldIsSidebar } from "payload/shared";
import {
  useEffect,
  useMemo,
  type FC,
  type ReactNode,
  Component,
  type ErrorInfo
} from "react";
import "./index.scss";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

// Error boundary for HandoffBridge
class HandoffErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("HandoffBridge Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI without HandoffBridge to prevent infinite loops
      console.warn("HandoffBridge error detected, rendering without bridge");
      return this.props.children;
    }

    return <HandoffBridge>{this.props.children}</HandoffBridge>;
  }
}

type Args = {
  readonly AfterFields?: ReactNode;
  readonly BeforeFields?: ReactNode;
  readonly Description?: ReactNode;
  readonly docPermissions: SanitizedDocumentPermissions;
  readonly fields: ClientField[];
  readonly forceSidebarWrap?: boolean;
  readonly isTrashed?: boolean;
  readonly readOnly?: boolean;
  readonly schemaPathSegments: string[];
};

export const DocumentFields: FC<Args> = ({
  AfterFields,
  BeforeFields,
  docPermissions,
  fields,
  forceSidebarWrap,
  isTrashed = false,
  readOnly,
  schemaPathSegments
}) => {
  const enableSidebar = useVaultSidebar((r) => r.setEnabled);

  const { hasRichText, hasSidebarFields, mainFields, sidebarFields } =
    useMemo(() => {
      return fields.reduce(
        (acc, field) => {
          if (field.type === "richText") {
            acc.hasRichText = true;
          }
          if (fieldIsSidebar(field)) {
            acc.sidebarFields.push(field);
            acc.mainFields.push(null!);
            acc.hasSidebarFields = true;
          } else {
            acc.mainFields.push(field);
            acc.sidebarFields.push(null!);
          }
          return acc;
        },
        {
          hasRichText: false,
          hasSidebarFields: false,
          mainFields: [] as ClientField[],
          sidebarFields: [] as ClientField[]
        }
      );
    }, [fields]);
  useEffect(() => {
    enableSidebar(hasSidebarFields);
  }, [enableSidebar, hasSidebarFields]);

  return (
    <div
      className={cn(
        "document-fields",
        hasSidebarFields
          ? "document-fields--has-sidebar"
          : "document-fields--no-sidebar",
        forceSidebarWrap && "document-fields--force-sidebar-wrap"
      )}
    >
      <div className="document-fields__main">
        <Gutter className="document-fields__edit">
          <HandoffBridge>
            {isTrashed && <TrashBanner />}
            {BeforeFields}
            <AlternateDocProvider>
              {hasRichText ? (
                <WriterProvider>
                  <RenderFields
                    className="document-fields__fields"
                    fields={mainFields}
                    forceRender
                    parentIndexPath=""
                    parentPath=""
                    parentSchemaPath={schemaPathSegments.join(".")}
                    permissions={docPermissions?.fields}
                    readOnly={readOnly}
                  />
                </WriterProvider>
              ) : (
                <RenderFields
                  className="document-fields__fields"
                  fields={mainFields}
                  forceRender
                  parentIndexPath=""
                  parentPath=""
                  parentSchemaPath={schemaPathSegments.join(".")}
                  permissions={docPermissions?.fields}
                  readOnly={readOnly}
                />
              )}
            </AlternateDocProvider>
          </HandoffBridge>
          {AfterFields}
        </Gutter>
      </div>
      {hasSidebarFields ? (
        <Sidebar
          parentSchemaPath={schemaPathSegments.join(".")}
          sidebarFields={sidebarFields}
          baseClass="document-fields"
          permissions={docPermissions}
          readOnly={readOnly}
        />
      ) : null}
    </div>
  );
};
