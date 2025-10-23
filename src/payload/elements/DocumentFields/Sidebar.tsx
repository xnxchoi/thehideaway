"use client";
import { cn } from "@/lib/utils";
import { useVaultSidebar } from "@/payload/providers/Admins";
import { RenderFields, useAllFormFields, useFormFields } from "@payloadcms/ui";
import Lenis from "lenis";
import { useLenis } from "lenis/react";
import {
  ClientField,
  type SanitizedDocumentPermissions,
  FormState,
  Tab,
  type ClientTab
} from "payload";
import { useCallback, useEffect, useRef, useMemo } from "react";
export const Sidebar = (props: {
  sidebarFields: ClientField[];
  baseClass: string;
  parentSchemaPath: string;
  permissions: SanitizedDocumentPermissions;
  readOnly?: boolean;
}) => {
  const { baseClass, sidebarFields, parentSchemaPath, permissions, readOnly } =
    props;
  const lenis = useLenis();
  const lenisRef = useRef<null | Lenis>(null);
  const pideRef = useRef<HTMLDivElement>(null!);
  const contentRef = useRef<HTMLDivElement>(null!);
  const [form] = useAllFormFields();

  // Create a memoized selector to extract sidebar field paths for performance
  const sidebarFieldPaths = useMemo(() => {
    const extractFieldPaths = (
      fields: ClientField[],
      parentPath = ""
    ): string[] => {
      const paths: string[] = [];
      fields.forEach((field) => {
        if (!field) return;
        if ("name" in field) {
          const fieldPath = parentPath
            ? `${parentPath}.${field.name}`
            : field.name;
          paths.push(fieldPath);
          // Handle nested fields (groups, arrays, blocks, etc.)
          if ("fields" in field && field.fields) {
            paths.push(...extractFieldPaths(field.fields, fieldPath));
          }
          if ("blocks" in field && field.blocks) {
            field.blocks.forEach((block) => {
              if (block.fields) {
                paths.push(
                  ...extractFieldPaths(
                    block.fields,
                    `${fieldPath}.${block.slug}`
                  )
                );
              }
            });
          }
          if ("tabs" in field && field.tabs) {
            (field.tabs as ClientTab[]).forEach((tab) => {
              if ("fields" in tab && tab.fields) {
                paths.push(...extractFieldPaths(tab.fields, fieldPath));
              }
            });
          }
        }
      });

      return paths;
    };

    return extractFieldPaths(sidebarFields);
  }, [sidebarFields]);

  // Performant selector to check if any sidebar fields have errors
  const hasSidebarErrors = useFormFields(([formState, dispatches]) => {
    if (!formState || !sidebarFieldPaths.length) return false;

    // Check if any sidebar field path has errors
    return sidebarFieldPaths.some((path) => {
      const field = formState[path];
      return (
        field &&
        (!field.valid || (field.errorMessage && field.errorMessage.length > 0))
      );
    });
  });

  const held = useVaultSidebar((store) => store.held);
  const sidebarOpen = useVaultSidebar((r) => r.open);
  const setPeeked = useVaultSidebar((r) => r.setPeeked);
  const setHeld = useVaultSidebar((r) => r.setHeld);
  const setState = useVaultSidebar((r) => r.setState);
  const peeked = useVaultSidebar((r) => r.peeked);
  const leaveSetup = useCallback(() => {
    lenis?.start();
  }, [lenis]);
  const enterSetup = useCallback(() => {
    lenis?.stop();
  }, [lenis]);
  const lastOpen = useRef(sidebarOpen);
  useEffect(() => {
    if (!pideRef.current) return;
    if (lastOpen.current !== sidebarOpen) {
      if (lastOpen.current && !sidebarOpen) {
        pideRef.current.addEventListener(
          "mouseleave",
          () => {
            setPeeked(false);
            setTimeout(() => {
              setHeld(false);
            }, 400);
          },
          { once: true }
        );
      }
    }
    lastOpen.current = sidebarOpen;
  }, [sidebarOpen, setHeld, setPeeked]);

  // Auto-show sidebar when there are errors in sidebar fields
  useEffect(() => {
    if (hasSidebarErrors) {
      setState(true);
    }
  }, [hasSidebarErrors, setState]);

  useEffect(() => {
    let lnis = lenisRef.current;

    if (lenis) {
      const content = contentRef.current;
      const wrapper = pideRef.current;
      if (!content || !wrapper) return;

      lnis = new Lenis({
        wrapper,
        content,
        autoRaf: true
      });
      lenisRef.current = lnis;
    }
    return () => {
      lnis && lnis.destroy();
      lnis = null;
      lenisRef.current = null;
    };
  }, [lenis]);
  return (
    <div className={`${baseClass}__sidebar-wrap`}>
      <div
        ref={pideRef}
        className={cn("document-fields__sidebar", held && "hold")}
        onMouseEnter={enterSetup}
        onMouseLeave={leaveSetup}
      >
        <div ref={contentRef} className={`${baseClass}__sidebar-fields`}>
          <RenderFields
            fields={sidebarFields}
            forceRender
            parentIndexPath=""
            parentPath=""
            parentSchemaPath={parentSchemaPath}
            permissions={permissions.fields}
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};
