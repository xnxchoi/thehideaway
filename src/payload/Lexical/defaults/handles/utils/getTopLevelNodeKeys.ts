"use client";
import type {LexicalEditor} from "@payloadcms/richtext-lexical/lexical";
import {$getRoot} from "@payloadcms/richtext-lexical/lexical";

export function getTopLevelNodeKeys(editor: LexicalEditor): string[] {
	return editor.getEditorState().read(() => $getRoot().getChildrenKeys());
}
