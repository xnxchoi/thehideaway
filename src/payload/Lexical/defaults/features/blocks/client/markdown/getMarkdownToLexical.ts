import type {
	Klass,
	LexicalNode,
	LexicalNodeReplacement,
	SerializedEditorState
} from "@payloadcms/richtext-lexical/lexical";

import {createHeadlessEditor} from "@payloadcms/richtext-lexical/lexical/headless";

import {
	$convertFromMarkdownString,
	type Transformer
} from "@payloadcms/richtext-lexical/lexical/markdown";

export function getMarkdownToLexical(
	allNodes: Array<Klass<LexicalNode> | LexicalNodeReplacement>,
	allTransformers: Transformer[]
): (args: { markdown: string }) => SerializedEditorState {
	const markdownToLexical = ({
		                           markdown
	                           }: {
		markdown: string;
	}): SerializedEditorState => {
		const headlessEditor = createHeadlessEditor({
			nodes: allNodes
		});

		headlessEditor.update(
			() => {
				$convertFromMarkdownString(markdown, allTransformers);
			},
			{discrete: true}
		);

		const editorJSON = headlessEditor.getEditorState().toJSON();

		return editorJSON;
	};
	return markdownToLexical;
}
