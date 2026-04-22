"use client";

import { Menu } from "@base-ui/react";
import { Fragment } from "react";

import type {
  ContextMenuGroup,
  ContextMenuItem,
  EditorContext
} from "../types";
import {
  MenuGroupLabel,
  MenuItem,
  MenuSeparator,
  SubmenuPopup,
  SubmenuTriggerItem
} from "./MenuPrimitives";

interface MenuRendererProps {
  groups: readonly ContextMenuGroup[];
  context: EditorContext;
  onItemSelected: () => void;
}

/**
 * Renders a composed set of groups into the Base UI menu tree. Each group is
 * separated by a `<MenuSeparator>`; labelled groups render their label as an
 * eyebrow.
 */
export function MenuRenderer({
  groups,
  context,
  onItemSelected
}: MenuRendererProps) {
  return (
    <>
      {groups.map((group, gi) => (
        <Fragment key={group.key}>
          {gi > 0 ? <MenuSeparator /> : null}
          {group.label ? <MenuGroupLabel>{group.label}</MenuGroupLabel> : null}
          {group.items.map((item) => (
            <MenuItemRenderer
              key={item.key}
              item={item}
              context={context}
              onItemSelected={onItemSelected}
            />
          ))}
        </Fragment>
      ))}
    </>
  );
}

function MenuItemRenderer({
  item,
  context,
  onItemSelected
}: {
  item: ContextMenuItem;
  context: EditorContext;
  onItemSelected: () => void;
}) {
  if (item.kind === "separator") {
    return <MenuSeparator />;
  }
  if (item.kind === "submenu") {
    const Icon = item.Icon;
    return (
      <Menu.SubmenuRoot>
        <SubmenuTriggerItem
          icon={Icon ? <Icon className="size-4" /> : undefined}
          disabled={item.disabled}
        >
          {item.label}
        </SubmenuTriggerItem>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} className="outline-none">
            <SubmenuPopup>
              {item.items.map((sub) => (
                <MenuItemRenderer
                  key={sub.key}
                  item={sub}
                  context={context}
                  onItemSelected={onItemSelected}
                />
              ))}
            </SubmenuPopup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.SubmenuRoot>
    );
  }

  const Icon = item.Icon;
  return (
    <MenuItem
      tone={item.tone}
      hint={item.hint}
      icon={Icon ? <Icon className="size-4" /> : undefined}
      disabled={item.disabled}
      onClick={() => {
        if (item.disabled) return;
        item.onSelect({ context });
        onItemSelected();
      }}
    >
      {item.label}
    </MenuItem>
  );
}
