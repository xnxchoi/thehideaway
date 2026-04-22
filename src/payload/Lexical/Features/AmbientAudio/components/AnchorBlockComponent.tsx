"use client";

import {
  $isInlineBlockNode,
  useInlineBlockComponentContext
} from "@payloadcms/richtext-lexical/client";
import { $getNodeByKey } from "@payloadcms/richtext-lexical/lexical";
import { useLexicalComposerContext } from "@payloadcms/richtext-lexical/lexical/react/LexicalComposerContext";
import { useEffect, useState } from "react";

import type { AmbientAnchorFields } from "../utils/anchors";
import { AnchorComponent } from "./AnchorComponent";

/**
 * `admin.components.Block` for `AmbientAudioAnchorBlock`. Payload
 * server-renders this inside `InlineBlockComponent` with
 * `UIFieldClientProps` — so `formData` is **not** passed as a prop. We
 * pull `nodeKey` from the inline-block context, look up the Lexical
 * node, and read its fields directly. Subscribing to editor updates
 * keeps the glyph in sync with drawer edits / plugin mutations.
 *
 * Rendering this component via `admin.components.Block` short-circuits
 * Payload's default label + edit/remove chrome (see `componentInline`
 * render branch at `{CustomBlock ? ... : ...}`), so what the user sees
 * is just the bare `<AnchorComponent>` glyph.
 */
export function AnchorBlockComponent() {
  const { nodeKey } = useInlineBlockComponentContext();
  const [editor] = useLexicalComposerContext();

  const [fields, setFields] = useState<AmbientAnchorFields | null>(() => {
    if (!nodeKey) return null;
    let result: AmbientAnchorFields | null = null;
    editor.getEditorState().read(() => {
      const node = $getNodeByKey(nodeKey);
      if (node && $isInlineBlockNode(node)) {
        result = node.getFields() as AmbientAnchorFields;
      }
    });
    return result;
  });

  useEffect(() => {
    if (!nodeKey) return;
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const node = $getNodeByKey(nodeKey);
        if (node && $isInlineBlockNode(node)) {
          setFields(node.getFields() as AmbientAnchorFields);
        }
      });
    });
  }, [editor, nodeKey]);

  if (!nodeKey || !fields) return null;
  return <AnchorComponent nodeKey={nodeKey} fields={fields} />;
}
