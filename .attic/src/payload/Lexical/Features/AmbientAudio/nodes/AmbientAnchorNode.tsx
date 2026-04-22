"use client";

import {
  $applyNodeReplacement,
  type EditorConfig,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey
} from "@payloadcms/richtext-lexical/lexical";
import ObjectID from "bson-objectid";
import type { JSX } from "react";

import { InlineBlockNode } from "@/payload/Lexical/defaults/features/blocks/client/nodes/InlineBlocksNode";
import type {
  InlineBlockFields,
  SerializedInlineBlockNode
} from "@/payload/Lexical/defaults/features/blocks/server/nodes/InlineBlocksNode";
import type { AmbientAudioAnchorBlock } from "@payload-types";

import { AMBIENT_AUDIO_ANCHOR_SLUG } from "../blocks/AmbientAudioAnchorBlock";
import { AnchorComponent } from "../components/AnchorComponent";

/**
 * Internal Lexical node type. Distinct from the parent's `"inlineBlock"`
 * so Lexical's registry can track the subclass as its own entry and the
 * strict-identity invariant in `LexicalNode` passes when we construct it.
 *
 * On-disk the node still serializes as `type: "inlineBlock"` (see
 * `exportJSON` below) so Payload's `inlineBlock` serialization, populate
 * pipeline, and afterDelete hooks continue to work unchanged.
 */
export const AMBIENT_ANCHOR_NODE_TYPE = "ambient-audio-anchor";

export type AmbientAnchorFields = InlineBlockFields<AmbientAudioAnchorBlock>;

function isAmbientFields(
  fields: InlineBlockFields | null | undefined
): fields is AmbientAnchorFields {
  return fields?.blockType === AMBIENT_AUDIO_ANCHOR_SLUG;
}

/**
 * Ambient-audio anchor node.
 *
 * Registered both as a standalone node (under `"ambient-audio-anchor"`)
 * and as a `LexicalNodeReplacement` for `InlineBlockNode`. Every inline
 * block in the editor becomes an `AmbientAnchorNode` at runtime; for any
 * blockType other than `ambientAudioAnchor`, `decorate()` delegates to
 * the parent's default chrome (Payload's drawer-edit UI). For our
 * blockType, `decorate()` returns the bare `<AnchorComponent>` glyph.
 *
 * `exportJSON()` overrides to emit `type: "inlineBlock"` — the on-disk
 * JSON is byte-identical to a stock Payload inline block. Payload's
 * relationship populate, afterDelete hook integrity, and JSON schema
 * all continue to drive `source.track` without awareness of this subclass.
 */
export class AmbientAnchorNode extends InlineBlockNode {
  static override getType(): string {
    return AMBIENT_ANCHOR_NODE_TYPE;
  }

  static override clone(node: AmbientAnchorNode): AmbientAnchorNode {
    return new AmbientAnchorNode({
      cacheBuster: node.__cacheBuster,
      fields: node.__fields,
      key: node.__key
    });
  }

  static override importJSON(
    serialized: SerializedInlineBlockNode
  ): AmbientAnchorNode {
    return $applyNodeReplacement(
      new AmbientAnchorNode({
        fields: serialized.fields as AmbientAnchorFields
      })
    );
  }

  override exportJSON(): SerializedInlineBlockNode {
    return {
      type: "inlineBlock",
      fields: this.getFields(),
      version: 1
    };
  }

  override decorate(editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const fields = this.getFields();
    if (!isAmbientFields(fields)) {
      return super.decorate(editor, config);
    }
    return <AnchorComponent nodeKey={this.getKey()} fields={fields} />;
  }
}

/**
 * Build a fresh ambient-anchor node. `id` is auto-assigned when omitted.
 * Wrapped in `$applyNodeReplacement` so the replacement chain composes
 * correctly.
 */
export function $createAmbientAnchorNode(
  fields: Omit<AmbientAnchorFields, "id" | "blockType"> & {
    id?: string;
    blockType?: typeof AMBIENT_AUDIO_ANCHOR_SLUG;
  },
  key?: NodeKey
): AmbientAnchorNode {
  return $applyNodeReplacement(
    new AmbientAnchorNode({
      fields: {
        ...fields,
        blockType: AMBIENT_AUDIO_ANCHOR_SLUG,
        id: fields.id ?? new ObjectID().toHexString()
      },
      key
    })
  );
}

export function $isAmbientAnchorNode(
  node: LexicalNode | null | undefined
): node is AmbientAnchorNode {
  return node instanceof AmbientAnchorNode && isAmbientFields(node.getFields());
}
