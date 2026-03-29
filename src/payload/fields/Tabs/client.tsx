import { RenderFields } from "@/payload/forms/RenderFields";

import { useCursor } from "@/providers/RP_Pro";
import { useGSAP } from "@gsap/react";
import { getTranslation } from "@payloadcms/translations";
import {
  ErrorPill,
  fieldBaseClass,
  FieldDescription,
  RenderCustomComponent,
  TabComponent,
  useCollapsible,
  useDocumentInfo,
  useField,
  useFormFields,
  usePreferences,
  useTranslation,
  WatchChildErrors,
  withCondition
} from "@payloadcms/ui";
import { gsap } from "gsap";
import { Flip } from "gsap/Flip";
import type {
  ClientComponentProps,
  ClientTab,
  DocumentPreferences,
  SanitizedFieldPermissions,
  StaticDescription,
  TabsFieldClientComponent
} from "payload";
import { getFieldPaths, tabHasName, toKebabCase } from "payload/shared";
import {
  ComponentPropsWithRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { TabsProvider } from "./provider";

const baseClass = "tabs-field";

gsap.registerPlugin(Flip);
export { TabsProvider };
function generateTabPath({
  activeTabConfig,
  path
}: {
  activeTabConfig: ClientTab;
  path: string;
}) {
  let tabPath = path;

  if (tabHasName(activeTabConfig) && activeTabConfig.name) {
    if (path) {
      tabPath = `${path}.${activeTabConfig.name}`;
    } else {
      tabPath = activeTabConfig.name;
    }
  }

  return tabPath;
}

const TabsFieldComponent: TabsFieldClientComponent = (props) => {
  const {
    field: { admin: { className } = {}, tabs = [] },
    forceRender = false,
    indexPath = "",
    parentPath = "",
    parentSchemaPath = "",
    path = "",
    permissions,
    readOnly,
    schemaPath = ""
  } = props;

  const { getPreference, setPreference } = usePreferences();
  const { preferencesKey } = useDocumentInfo();
  const { i18n } = useTranslation();
  const { isWithinCollapsible } = useCollapsible();

  const tabStates = useFormFields(([fields]) => {
    return tabs.map((tab, index) => {
      const id = tab?.id;

      return {
        index,
        passesCondition: id ? (fields?.[id]?.passesCondition ?? true) : false,
        tab
      };
    });
  });

  const tabsRef = useRef<Array<HTMLElement>>([]);

  const [activeTabIndex, setActiveTabIndex] = useState<number>(
    () =>
      tabStates.filter(({ passesCondition }) => passesCondition)?.[0]?.index ??
      0
  );
  const initialIndex = useRef(activeTabIndex);
  const lastActiveTab = useRef(activeTabIndex);
  const indicatorRef = useRef<HTMLDivElement>(null!);

  const tabsPrefKey = `tabs-${indexPath}`;
  const [activeTabPath, setActiveTabPath] = useState<string>(() =>
    generateTabPath({
      activeTabConfig: tabs[activeTabIndex]!,
      path: parentPath
    })
  );

  const [activeTabSchemaPath, setActiveTabSchemaPath] = useState<string>(() =>
    generateTabPath({ activeTabConfig: tabs[0]!, path: parentSchemaPath })
  );

  const activePathChildrenPath = tabHasName(tabs[activeTabIndex]!)
    ? activeTabPath
    : parentPath;
  const activeTabInfo = tabStates[activeTabIndex];
  const activeTabConfig = activeTabInfo?.tab;
  const activeTabDescription =
    activeTabConfig?.admin?.description ?? activeTabConfig?.description;

  const activeTabStaticDescription =
    typeof activeTabDescription === "function"
      ? //@ts-expect-error t being a mess
        activeTabDescription({ i18n, t: i18n.t })
      : activeTabDescription!;

  const hasVisibleTabs = tabStates.some(
    ({ passesCondition }) => passesCondition
  );

  const activePathSchemaChildrenPath = tabHasName(tabs[activeTabIndex]!)
    ? activeTabSchemaPath
    : parentSchemaPath;

  const handleTabChange = useCallback(
    async (incomingTabIndex: number): Promise<void> => {
      setActiveTabIndex(incomingTabIndex);

      const existingPreferences: DocumentPreferences = await getPreference(
        preferencesKey!
      );
      if (preferencesKey) {
        void setPreference(preferencesKey, {
          ...existingPreferences,
          ...(path
            ? {
                fields: {
                  ...(existingPreferences?.fields || {}),
                  [path]: {
                    ...existingPreferences?.fields?.[path],
                    tabIndex: incomingTabIndex
                  }
                }
              }
            : {
                fields: {
                  ...existingPreferences?.fields,
                  [tabsPrefKey]: {
                    ...existingPreferences?.fields?.[tabsPrefKey],
                    tabIndex: incomingTabIndex
                  }
                }
              })
        });
      }
    },
    [getPreference, preferencesKey, setPreference, path, tabsPrefKey]
  );

  useEffect(() => {
    if (preferencesKey) {
      const getInitialPref = async () => {
        const existingPreferences: DocumentPreferences =
          await getPreference(preferencesKey);
        const initialIndex = path
          ? existingPreferences?.fields?.[path]?.tabIndex
          : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex;

        const newIndex =
          typeof initialIndex === "number" && initialIndex < tabStates.length
            ? initialIndex
            : 0;
        setActiveTabIndex(newIndex);
      };
      void getInitialPref();
    }
  }, [
    path,
    getPreference,
    preferencesKey,
    tabsPrefKey,
    tabs,
    parentPath,
    parentSchemaPath
  ]);
  useEffect(() => {
    if (activeTabInfo?.passesCondition === false) {
      const nextTab = tabStates.find(({ passesCondition }) => passesCondition);
      if (nextTab) {
        void handleTabChange(nextTab.index);
      }
    }
  }, [activeTabInfo, tabStates, handleTabChange]);
  useGSAP(() => {
    if (lastActiveTab.current !== activeTabIndex) {
      const a = Flip.getState(indicatorRef.current);
      const target = tabsRef.current[lastActiveTab.current];
      if (target) {
        target.append(indicatorRef.current);
        Flip.from(a, {
          ease: "power2.out",
          duration: 0.2
        });
      }
      lastActiveTab.current = activeTabIndex;
    }
  }, [activeTabIndex]);

  useEffect(() => {
    if (preferencesKey) {
      const getInitialPref = async () => {
        const existingPreferences: DocumentPreferences =
          await getPreference(preferencesKey);
        const initialIndex = path
          ? existingPreferences?.fields?.[path]?.tabIndex
          : existingPreferences?.fields?.[tabsPrefKey]?.tabIndex;

        const newIndex = initialIndex || 0;
        setActiveTabIndex(newIndex);
        const newConfig = tabs[newIndex];
        if (!newConfig) return;
        setActiveTabPath(
          generateTabPath({ activeTabConfig: newConfig, path: parentPath })
        );
        setActiveTabSchemaPath(
          generateTabPath({
            activeTabConfig: newConfig,
            path: parentSchemaPath
          })
        );
      };
      void getInitialPref();
    }
  }, [
    path,
    getPreference,
    preferencesKey,
    tabsPrefKey,
    tabs,
    parentPath,
    parentSchemaPath
  ]);

  const pmissions = useMemo(() => {
    if (
      "name" in activeTabConfig &&
      activeTabConfig.name &&
      typeof permissions === "object" &&
      permissions &&
      "fields" in permissions &&
      !!permissions.fields
    ) {
      if (permissions.fields === true) return true;
      const n = activeTabConfig.name;
      if (!!permissions.fields[n]) {
        return permissions.fields[activeTabConfig.name];
      }
    }
    return (
      (!!permissions && permissions) ||
      ({
        read: true,
        update: true,
        create: true
      } satisfies SanitizedFieldPermissions)
    );
  }, [activeTabConfig, permissions]);
  return (
    <div
      className={[
        fieldBaseClass,
        className,
        baseClass,
        isWithinCollapsible && `${baseClass}--within-collapsible`,
        !hasVisibleTabs && `${baseClass}--hidden`
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <TabsProvider>
        <div className={`${baseClass}__tabs-wrap`}>
          FUCK
          <div className={`${baseClass}__tabs`}>
            {tabStates.map(({ index, passesCondition, tab }) => (
              <>
                <TabComp
                  index={index}
                  hidden={!passesCondition}
                  isActive={activeTabIndex === index}
                  key={index}
                  parentPath={path}
                  setIsActive={() => {
                    void handleTabChange(index);
                  }}
                  tab={tab}
                />
                {index === 0 && (
                  <div
                    ref={indicatorRef}
                    className="absolute -bottom-[1px] h-[2px] w-full bg-foreground"
                  />
                )}
              </>
            ))}
          </div>
        </div>
        <div className={`${baseClass}__content-wrap`}>
          {activeTabConfig && !!permissions && (
            <TabContent
              description={activeTabStaticDescription}
              field={activeTabConfig}
              forceRender={forceRender}
              hidden={false}
              parentIndexPath={indexPath}
              parentPath={path}
              tabIndex={activeTabIndex}
              parentSchemaPath={schemaPath}
              path={activeTabPath}
              permissions={
                permissions &&
                typeof permissions === "object" &&
                "name" in activeTabConfig &&
                activeTabConfig.name
                  ? permissions[
                      activeTabConfig.name as keyof typeof permissions
                    ] &&
                    permissions[
                      activeTabConfig.name as keyof typeof permissions
                    ] !== undefined &&
                    typeof permissions[
                      activeTabConfig.name as keyof typeof permissions
                    ] === "object" &&
                    "fields" in
                      (permissions[
                        activeTabConfig.name as keyof typeof permissions
                      ] as object)
                    ? (permissions[
                        activeTabConfig.name as keyof typeof permissions
                      ] as { fields: SanitizedFieldPermissions } & object)!
                        .fields
                    : (permissions[
                        activeTabConfig.name as keyof typeof permissions
                      ] as SanitizedFieldPermissions)
                  : permissions
              }
              readOnly={readOnly || false}
            />
          )}
        </div>
      </TabsProvider>
    </div>
  );
};
export default TabsFieldComponent;
export const TabsField = withCondition(TabsFieldComponent);
const TabComp = (
  props: ComponentPropsWithRef<"div"> &
    Parameters<typeof TabComponent>[0] & { index: number }
) => {
  const {
    ref,
    children,
    hidden,
    isActive,
    setIsActive,
    parentPath,
    tab,
    ...rest
  } = props;
  const setCursor = useCursor((r) => r.setCursorState);
  const [errorCount, setErrorCount] = useState<undefined | number>(undefined);
  const path = [
    // removes parent 'tabs' path segment, i.e. `_index-0`
    ...(parentPath ? parentPath.split(".").slice(0, -1) : []),
    ...(tabHasName(tab) ? [tab.name] : [])
  ];

  const setCur = useCallback(
    ({
      passesCondition,
      isActive
    }: {
      passesCondition: boolean;
      isActive: boolean;
    }) =>
      () =>
        setCursor(!passesCondition || isActive ? null : "FOCUS"),
    [setCursor]
  );
  const fieldHasErrors = typeof errorCount !== "undefined" && errorCount > 0;
  const { i18n } = useTranslation();

  const resetCur = useCallback(() => setCursor(null), [setCursor]);
  return (
    <div ref={ref}>
      <WatchChildErrors
        fields={tab.fields}
        path={path}
        setErrorCount={setErrorCount}
      />
      <TabComponent
        parentPath={parentPath}
        setIsActive={setIsActive}
        tab={tab}
      />
      {children}
      {fieldHasErrors && <ErrorPill count={errorCount} i18n={i18n} />}
    </div>
  );
};
type ActiveTabProps = {
  readonly description: StaticDescription;
  readonly field: ClientTab;
  readonly hidden: boolean;
  readonly label?: string;
  readonly parentIndexPath: string;
  readonly parentPath: string;
  readonly parentSchemaPath: string;
  readonly path: string;
  readonly permissions: SanitizedFieldPermissions;
  readonly readOnly: boolean;
  readonly tabIndex: number;
} & Pick<ClientComponentProps, "forceRender">;

function TabContent({
  description,
  field,
  forceRender,
  hidden,
  label,
  parentIndexPath,
  parentPath,
  parentSchemaPath,
  permissions,
  readOnly,
  tabIndex
}: ActiveTabProps) {
  const { i18n } = useTranslation();

  const {
    customComponents: { AfterInput, BeforeInput, Description, Field } = {}
  } = useField();

  if (Field) {
    return Field;
  }

  const { indexPath, path, schemaPath } = getFieldPaths({
    field,
    index: tabIndex,
    parentIndexPath,
    parentPath,
    parentSchemaPath
  });

  return (
    <div
      className={[
        hidden && `${baseClass}__tab--hidden`,
        `${baseClass}__tab`,
        label &&
          `${baseClass}__tabConfigLabel-${toKebabCase(getTranslation(label, i18n))}`
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <RenderCustomComponent
        CustomComponent={Description}
        Fallback={
          <FieldDescription
            description={description}
            marginPlacement="bottom"
            path={path}
          />
        }
      />
      {BeforeInput}
      <RenderFields
        fields={field.fields}
        forceRender={forceRender}
        parentIndexPath={parentIndexPath}
        parentPath={parentPath}
        parentSchemaPath={parentSchemaPath}
        permissions={permissions}
        readOnly={readOnly}
      />
      {AfterInput}
    </div>
  );
}
