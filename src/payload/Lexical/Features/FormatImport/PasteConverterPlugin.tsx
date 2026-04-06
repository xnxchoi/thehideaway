"use client";

import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import {
  COMMAND_PRIORITY_HIGH,
  PASTE_COMMAND,
  $getRoot,
  $getSelection,
  $isRangeSelection
} from "@payloadcms/richtext-lexical/lexical";
import { $generateNodesFromDOM } from "@payloadcms/richtext-lexical/lexical/html";
import { useEffect } from "react";
import { markdownToHtml } from "./utils/markdownToHtml";

// ── Detection helpers ──────────────────────────────────────────────────────

/**
 * Returns true if the plain-text string looks like markdown.
 * Uses a scoring heuristic: at least one block-level marker, or one block
 * marker + an inline marker together.
 */
function isLikelyMarkdown(text: string): boolean {
  if (!text || text.length < 10) return false;
  const lines = text.split("\n");
  let blockCount = 0;

  for (const line of lines) {
    const t = line.trimStart();
    if (
      /^#{1,6}\s/.test(t) || // headings
      /^[-*+]\s/.test(t) || // unordered list
      /^\d+\.\s/.test(t) || // ordered list
      /^>\s/.test(t) || // blockquote
      /^```/.test(t) // code fence
    ) {
      blockCount++;
    }
  }

  const hasInline =
    /\*{2}[^*]+\*{2}/.test(text) || // bold
    /(?<!\*)\*[^*\n]+\*(?!\*)/.test(text) || // italic
    /`[^`]+`/.test(text) || // inline code
    /\[[^\]]+\]\([^)]+\)/.test(text); // link

  return blockCount >= 2 || (blockCount >= 1 && hasInline);
}

/**
 * Returns true if the HTML string contains Notion-specific markers.
 * Notion pastes its own HTML with distinctive data attributes and classes.
 */
function isNotionHTML(html: string): boolean {
  return (
    html.includes("data-content-editable-leaf") ||
    html.includes("notion-hashedblockpage") ||
    html.includes("class=\u0022notion-") ||
    /data-notion-/.test(html)
  );
}

// ── DOM insertion helper ───────────────────────────────────────────────────

function insertHtmlAtSelection(
  editor: ReturnType<typeof useLexicalComposerContext>[0],
  html: string
): boolean {
  try {
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");

    editor.update(() => {
      const nodes = $generateNodesFromDOM(editor, dom);
      if (!nodes.length) return;

      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.insertNodes(nodes);
      } else {
        // Fallback: append to root
        const root = $getRoot();
        const lastChild = root.getLastChild();
        if (lastChild) {
          lastChild.insertAfter(nodes[0]);
          for (let i = 1; i < nodes.length; i++) {
            nodes[i - 1].insertAfter(nodes[i]);
          }
        } else {
          root.append(...nodes);
        }
      }
    });
    return true;
  } catch {
    return false;
  }
}

// ── Plugin ─────────────────────────────────────────────────────────────────

export function PasteConverterPlugin(): null {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerCommand<ClipboardEvent>(
      PASTE_COMMAND,
      (event) => {
        const data = event.clipboardData;
        if (!data) return false;

        const htmlContent = data.getData("text/html");
        const textContent = data.getData("text/plain");

        // ── Notion HTML ──────────────────────────────────────────────────
        if (htmlContent && isNotionHTML(htmlContent)) {
          event.preventDefault();
          return insertHtmlAtSelection(editor, htmlContent);
        }

        // ── Markdown (plain text, no rich HTML source) ───────────────────
        if (textContent && isLikelyMarkdown(textContent)) {
          // Only convert when there is no rich HTML origin (i.e. the source
          // is a text editor / terminal / Markdown file, not a web page that
          // also placed HTML in the clipboard).
          const hasRichHtml =
            htmlContent &&
            (htmlContent.includes("<p") ||
              htmlContent.includes("<div") ||
              htmlContent.includes("<span"));

          if (!hasRichHtml) {
            event.preventDefault();
            const html = markdownToHtml(textContent);
            return insertHtmlAtSelection(editor, html);
          }
        }

        // Let Lexical's default paste handling proceed
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [editor]);

  return null;
}
