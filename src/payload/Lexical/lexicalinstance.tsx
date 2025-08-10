'use client'
import {
	InitialConfigType,
	LexicalComposer
} from '@payloadcms/richtext-lexical/lexical/react/LexicalComposer'
import {RichTextPlugin} from '@payloadcms/richtext-lexical/lexical/react/LexicalRichTextPlugin'
import {ContentEditable} from '@payloadcms/richtext-lexical/lexical/react/LexicalContentEditable'
import {HistoryPlugin} from '@payloadcms/richtext-lexical/lexical/react/LexicalHistoryPlugin'
import {OnChangePlugin} from '@payloadcms/richtext-lexical/lexical/react/LexicalOnChangePlugin'
import type {SanitizedConfig} from 'payload'
import {useMemo, useState} from 'react'
import {Button} from '@/components/ui/button'
import {EditorConfig} from 'lexical'
import './LexicalEditor.scss'
import './EditorTheme.scss'

interface EditorProps {
	config: EditorConfig;
	initialContent?: undefined;
	onChange?: (editorState) => void;
}

const LoadingEditor = () => (<div className="editor-loading">Loading editor...</div>)

function onError(error) {
	console.error(error);
}

export const LexicalFrontendEditor = ({config, initialContent, onChange}: EditorProps) => {
	const [editorConfig, setEditorConfig] = useState<InitialConfigType>(null!);
	const [serializedContent, setSerializedContent] = useState<string>("");
	const initialConfig = useMemo<InitialConfigType>(() => {


		return {
			editable: true,
			editorState: undefined,
			namespace: config.namespace,
			onError,
			theme: config.theme,
		}
		// Important: do not add readOnly and value to the dependencies array. This will cause the entire lexical editor to re-render if the document is saved, which will
		// cause the editor to lose focus.
	}, [editorConfig])

	const handleEditorChange = (editorState: any) => {
		const serialized = JSON.stringify(editorState.toJSON());
		setSerializedContent(serialized);
		if (onChange) onChange(editorState);
	};

	const copyToClipboard = () => {
		if (serializedContent) {
			navigator.clipboard.writeText(serializedContent);
		}
	};


	return (
		<div className="editor-container">
			<LexicalComposer initialConfig={initialConfig}>
				<RichTextPlugin contentEditable={<ContentEditable />}
				                placeholder={<div>Enter your content...</div>}
				                ErrorBoundary={LoadingEditor} />
				<HistoryPlugin />
				<OnChangePlugin onChange={handleEditorChange} />
			</LexicalComposer>
			<Button
				className="w-[175px] h-[45px] rounded-xl backdrop-blur-lg z-[245] fixed left-[50%] bottom-[55px] translate-x-[-50%] hover:text-[bg] hover:bg-[oklch(var(--fg)/.2)] transition-all duration-200 ease-in-out"
				onClick={copyToClipboard}>
				Copy to Clipboard
			</Button>
		</div>
	);
}