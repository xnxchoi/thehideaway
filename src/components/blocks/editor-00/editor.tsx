"use client"

import {
	InitialConfigType,
	LexicalComposer,
} from "@lexical/react/LexicalComposer"
import {OnChangePlugin} from "@lexical/react/LexicalOnChangePlugin"
import {EditorState, SerializedEditorState} from "lexical"

import {editorTheme} from "@/components/editor/themes/editor-theme"
import {TooltipProvider} from "@/components/ui/tooltip"

import {nodes} from "./nodes"
import {Plugins} from "./plugins"
import {FloatingLinkContext} from "@/components/editor/context/floating-link-context"
import {SharedAutocompleteContext} from "@/components/editor/context/shared-autocomplete-context"

const editorConfig: InitialConfigType = {
	namespace: "Editor",
	theme: editorTheme,
	nodes,
	onError: (error: Error) => {
		console.error(error)
	},
}

export function Editor({
	editorState,
	editorSerializedState,
	onChange,
	onSerializedChange,
}: {
	editorState?: EditorState
	editorSerializedState?: SerializedEditorState
	onChange?: (editorState: EditorState) => void
	onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
}) {
	return (
		<div
			className="w-screen h-screen relative top-0 left-0 bg-background overflow-hidden rounded-lg">
			<LexicalComposer initialConfig={{
				...editorConfig,
				...(editorState ? {editorState} : {}),
				...(editorSerializedState
					? {editorState: JSON.stringify(editorSerializedState)}
					: {}),
			}}>
				<TooltipProvider>
					<SharedAutocompleteContext>
						<FloatingLinkContext>
							<Plugins />
							<OnChangePlugin ignoreSelectionChange={true}
							                onChange={(editorState) => {
								                onChange?.(editorState)
								                onSerializedChange?.(editorState.toJSON())
							                }} />
						</FloatingLinkContext>
					</SharedAutocompleteContext>
				</TooltipProvider>
			</LexicalComposer>
		</div>
	)
}
