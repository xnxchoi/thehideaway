import type {
  CustomComponent,
  DocumentSubViewTypes,
  PayloadRequest,
  ServerProps,
  ViewTypes,
  VisibleEntities
} from "payload";

import {
  ActionsProvider,
  BulkUploadProvider,
  EntityVisibilityProvider,
  NavToggler
} from "@payloadcms/ui";
import { RenderServerComponent } from "@payloadcms/ui/elements/RenderServerComponent";
import { Wrapper } from "node_modules/@payloadcms/next/dist/templates/Default/Wrapper";
import "./index.scss";

import {
  useMemo,
  type FC,
  type FunctionComponent,
  type ReactNode
} from "react";
import { DefaultNav } from "../elements/Nav";
import { AppHeader } from "../elements/AppHeader";

const baseClass = "template-default";

export type DefaultTemplateProps = {
  children?: ReactNode;
  className?: string;
  collectionSlug?: string;
  docID?: number | string;
  documentSubViewType?: DocumentSubViewTypes;
  globalSlug?: string;
  req?: PayloadRequest;
  viewActions?: CustomComponent[];
  viewType?: ViewTypes;
  visibleEntities: VisibleEntities;
} & ServerProps;

export const DefaultTemplate: FC<DefaultTemplateProps> = ({
  children,
  className,
  collectionSlug,
  docID,
  documentSubViewType,
  globalSlug,
  i18n,
  locale,
  params,
  payload,
  permissions,
  req,
  searchParams,
  user,
  viewActions,
  viewType,
  visibleEntities
}) => {
  const {
    admin: {
      avatar,
      components,
      components: { header: CustomHeader, Nav: CustomNav } = {
        header: undefined,
        Nav: undefined
      }
    } = {}
  } = payload?.config || {};

  const clientProps = useMemo(() => {
    return {
      documentSubViewType,
      viewType,
      visibleEntities
    };
  }, [documentSubViewType, viewType, visibleEntities]);

  const serverProps = useMemo<ServerProps>(
    () => ({
      collectionSlug,
      docID,
      globalSlug,
      i18n,
      locale,
      params,
      payload,
      permissions,
      req,
      searchParams,
      user
    }),
    [
      i18n,
      locale,
      params,
      payload,
      permissions,
      searchParams,
      user,
      globalSlug,
      collectionSlug,
      docID,
      req
    ]
  );

  const { Actions } = useMemo<{
    Actions?: Record<string, ReactNode>;
  }>(() => {
    return {
      Actions: viewActions
        ? viewActions.reduce(
            (acc, action) => {
              if (action) {
                if (typeof action === "object") {
                  acc[action.path] = RenderServerComponent({
                    clientProps,
                    Component: action,
                    importMap: payload?.importMap,
                    serverProps
                  });
                } else {
                  acc[action] = RenderServerComponent({
                    clientProps,
                    Component: action,
                    importMap: payload?.importMap,
                    serverProps
                  });
                }
              }

              return acc;
            },
            {} as Record<string, ReactNode>
          )
        : undefined
    };
  }, [payload, serverProps, viewActions, clientProps]);

  const NavComponent = RenderServerComponent({
    clientProps,
    Component: CustomNav,
    Fallback: DefaultNav as FunctionComponent<{}>,
    importMap: payload?.importMap,
    serverProps
  });

  return (
    <EntityVisibilityProvider visibleEntities={visibleEntities}>
      <BulkUploadProvider drawerSlugPrefix={collectionSlug}>
        <ActionsProvider Actions={Actions}>
          {RenderServerComponent({
            clientProps,
            Component: CustomHeader,
            importMap: payload?.importMap,
            serverProps
          })}
          <div style={{ position: "relative" }}>
            <div
              className={`${baseClass}__nav-toggler-wrapper`}
              id="nav-toggler"
            >
              <div className={`${baseClass}__nav-toggler-container`}>
                <NavToggler
                  className={
                    "absolute top-0 left-0 flex h-[24px] w-[24px] items-center justify-center rounded-[4px] transition-[opacity,colors] duration-200 ease-out-power3 select-none"
                  }
                >
                  <svg
                    aria-hidden={true}
                    role="graphics-symbol"
                    viewBox={"0 0 20 20"}
                    style={{
                      width: 22,
                      height: 22,
                      display: "block",
                      fill: "oklch(var(--faded-fg)/1)",
                      flexShrink: 0
                    }}
                  >
                    <path d="M2.275 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 5m0 5c0-.345.28-.625.625-.625h14.2a.625.625 0 1 1 0 1.25H2.9A.625.625 0 0 1 2.275 10m.625 4.375a.625.625 0 1 0 0 1.25h14.2a.625.625 0 1 0 0-1.25z"></path>{" "}
                  </svg>
                </NavToggler>
              </div>
            </div>
            <Wrapper baseClass={baseClass} className={className}>
              {NavComponent}
              <div className={`${baseClass}__wrap`}>
                <AppHeader
                  CustomAvatar={
                    avatar && avatar !== "gravatar" && avatar !== "default"
                      ? RenderServerComponent({
                          Component: avatar.Component,
                          importMap: payload?.importMap,
                          serverProps
                        })
                      : undefined
                  }
                  CustomIcon={
                    components?.graphics?.Icon
                      ? RenderServerComponent({
                          Component: components.graphics.Icon,
                          importMap: payload?.importMap,
                          serverProps
                        })
                      : undefined
                  }
                />
                {children}
              </div>
            </Wrapper>
          </div>
        </ActionsProvider>
      </BulkUploadProvider>
    </EntityVisibilityProvider>
  );
};
