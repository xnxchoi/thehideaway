"use client"

import {useState} from "react"
import {
	InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer"
import {LexicalErrorBoundary} from "@lexical/react/LexicalErrorBoundary"
import {RichTextPlugin} from "@lexical/react/LexicalRichTextPlugin"
import {HeadingNode, QuoteNode} from "@lexical/rich-text"
import {ParagraphNode, TextNode} from "lexical"
import {SerializedEditorState} from "lexical"
import {Plus} from "lucide-react"

import {Button} from "@/components/ui/button"
import {TooltipProvider} from "@/components/ui/tooltip"
import {editorTheme} from "@/components/editor/themes/editor-theme"
import {ContentEditable} from "@/components/editor/editor-ui/content-editable"
import {ToolbarPlugin} from "@/components/editor/plugins/toolbar/toolbar-plugin"
import {Editor} from "@/components/blocks/editor-00/editor"

const initialValue = {
	root: {
		children: [
			{
				children: [
					{
						detail: 0,
						format: 0,
						mode: "normal",
						style: "",
						text: "Hello World 🚀",
						type: "text",
						version: 1,
					},
				],
				direction: "ltr",
				format: "",
				indent: 0,
				type: "paragraph",
				version: 1,
			},
		],
		direction: "ltr",
		format: "",
		indent: 0,
		type: "root",
		version: 1,
	},
} as unknown as SerializedEditorState

function EditorSection() {
	const [editorState, setEditorState] =
		useState<SerializedEditorState>(initialValue)

	return (
		<Editor editorSerializedState={editorState}
		        onSerializedChange={(value) => setEditorState(value)} />
	)
}

export default function Editor00Page() {
	return (
		<div className="flex flex-col gap-4">
			<EditorSection />
		</div>
	)
}