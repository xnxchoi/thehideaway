"use client";

import {
  $getSelection,
  $isRangeSelection,
  COPY_COMMAND,
  CUT_COMMAND,
  PASTE_COMMAND,
  SELECTION_CHANGE_COMMAND
} from "@payloadcms/richtext-lexical/lexical";

import type {
  ContextMenuContributor,
  ContextMenuGroup,
  EditorContext
} from "../types";

/**
 * Dispatches a synthetic ClipboardEvent through Lexical's COPY/CUT commands.
 * Lexical serializes the current selection into the event's data transfer.
 */
function dispatchSyntheticClipboard(
  editor: EditorContext["editor"],
  type: "cut" | "copy"
) {
  try {
    const event = new ClipboardEvent(type, {
      bubbles: true,
      cancelable: true,
      clipboardData: new DataTransfer()
    });
    if (type === "copy") {
      editor.dispatchCommand(COPY_COMMAND, event);
    } else {
      editor.dispatchCommand(CUT_COMMAND, event);
    }
    const data = event.clipboardData;
    if (data && typeof navigator !== "undefined" && navigator.clipboard) {
      const html = data.getData("text/html");
      const text = data.getData("text/plain");
      const items: ClipboardItem[] = [];
      if (html) {
        items.push(
          new ClipboardItem({
            "text/html": new Blob([html], { type: "text/html" }),
            "text/plain": new Blob([text], { type: "text/plain" })
          })
        );
      } else if (text) {
        navigator.clipboard.writeText(text).catch(() => {});
      }
      if (items.length > 0) {
        navigator.clipboard.write(items).catch(() => {});
      }
    }
  } catch {
    // noop — fallback to browser default if synthetic dispatch fails.
  }
}

async function pasteFromSystemClipboard(
  editor: EditorContext["editor"]
): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) return;
  try {
    const dt = new DataTransfer();
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          const blob = await item.getType(type);
          const text = await blob.text();
          dt.setData(type, text);
        }
      }
    } catch {
      const text = await navigator.clipboard.readText();
      dt.setData("text/plain", text);
    }
    const event = new ClipboardEvent("paste", {
      bubbles: true,
      cancelable: true,
      clipboardData: dt
    });
    editor.dispatchCommand(PASTE_COMMAND, event);
    // Make sure Lexical resyncs after a programmatic paste.
    editor.dispatchCommand(SELECTION_CHANGE_COMMAND, undefined);
  } catch {
    // noop
  }
}

export const clipboardContributor: ContextMenuContributor = {
  id: "rp-ctxmenu.clipboard",
  order: 20,
  resolve(context) {
    const canCopy =
      context.hasTextSelection || context.selectionKind === "node";

    const group: ContextMenuGroup = {
      key: "clipboard",
      order: 20,
      items: [
        {
          kind: "item",
          key: "clipboard.cut",
          label: "Cut",
          hint: "⌘X",
          disabled: !canCopy,
          order: 10,
          onSelect: ({ context: ctx }) =>
            dispatchSyntheticClipboard(ctx.editor, "cut")
        },
        {
          kind: "item",
          key: "clipboard.copy",
          label: "Copy",
          hint: "⌘C",
          disabled: !canCopy,
          order: 20,
          onSelect: ({ context: ctx }) =>
            dispatchSyntheticClipboard(ctx.editor, "copy")
        },
        {
          kind: "item",
          key: "clipboard.paste",
          label: "Paste",
          hint: "⌘V",
          order: 30,
          onSelect: ({ context: ctx }) => {
            void pasteFromSystemClipboard(ctx.editor);
          }
        },
        {
          kind: "item",
          key: "clipboard.selectAll",
          label: "Select all",
          hint: "⌘A",
          order: 40,
          onSelect: ({ context: ctx }) => {
            ctx.editor.update(() => {
              const selection = $getSelection();
              if ($isRangeSelection(selection)) {
                // Select full root content.
                selection.anchor.set("root", 0, "element");
                const root = selection.focus
                  .getNode()
                  .getTopLevelElementOrThrow();
                const last = root.getParent()?.getLastDescendant();
                if (last) {
                  selection.focus.set(
                    last.getKey(),
                    last.getTextContentSize(),
                    "text"
                  );
                }
              }
            });
          }
        }
      ]
    };
    return [group];
  }
};
